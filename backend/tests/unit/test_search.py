import io
from unittest.mock import patch

import pytest
from pypdf import PdfWriter


def register_and_login(client, email, name, password="secret123"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "full_name": name, "password": password},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    return response.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def owner_token(client):
    return register_and_login(client, "owner@example.com", "Owner User")


@pytest.fixture
def outsider_token(client):
    return register_and_login(client, "outsider@example.com", "Outsider User")


@pytest.fixture
def project_id(client, owner_token):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Search Project"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


def create_document(client, token, project_id, title):
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = io.BytesIO()
    writer.write(buffer)
    with patch("app.api.v1.documents.upload_file"), patch(
        "app.api.v1.documents.process_document_version.delay"
    ):
        return client.post(
            f"/api/v1/projects/{project_id}/documents",
            headers=auth_header(token),
            files={"file": ("doc.pdf", buffer.getvalue(), "application/pdf")},
            data={"title": title, "description": f"Descrição sobre {title}"},
        ).json()


def test_search_documents_by_title(client, owner_token, project_id):
    create_document(client, owner_token, project_id, "Relatório Financeiro")
    create_document(client, owner_token, project_id, "Manual do Usuário")

    response = client.get(
        f"/api/v1/projects/{project_id}/search?q=Financeiro",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Financeiro" in d["title"] for d in data["documents"])


def test_search_documents_by_description(client, owner_token, project_id):
    create_document(client, owner_token, project_id, "Documento X")
    response = client.get(
        f"/api/v1/projects/{project_id}/search?q=Documento X&type=documents",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert response.json()["total"] >= 1


def test_search_messages(client, owner_token, project_id):
    client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Precisamos revisar a arquitetura do backend"},
    )
    response = client.get(
        f"/api/v1/projects/{project_id}/search?q=arquitetura&type=messages",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["messages"]) == 1
    assert "arquitetura" in data["messages"][0]["content"]


def test_search_type_filter_documents(client, owner_token, project_id):
    create_document(client, owner_token, project_id, "Alpha")
    client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Mensagem sobre Alpha"},
    )
    response = client.get(
        f"/api/v1/projects/{project_id}/search?q=Alpha&type=documents",
        headers=auth_header(owner_token),
    )
    data = response.json()
    assert len(data["messages"]) == 0
    assert len(data["documents"]) >= 1


def test_search_requires_min_length(client, owner_token, project_id):
    response = client.get(
        f"/api/v1/projects/{project_id}/search?q=a",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 422


def test_search_isolated_by_project(client, owner_token, project_id):
    create_document(client, owner_token, project_id, "Segredo Interno")
    other_project = client.post(
        "/api/v1/projects",
        json={"name": "Outro Projeto"},
        headers=auth_header(owner_token),
    ).json()["id"]

    response = client.get(
        f"/api/v1/projects/{other_project}/search?q=Segredo",
        headers=auth_header(owner_token),
    )
    assert response.json()["total"] == 0


def test_search_forbidden_for_outsider(client, outsider_token, project_id):
    response = client.get(
        f"/api/v1/projects/{project_id}/search?q=teste",
        headers=auth_header(outsider_token),
    )
    assert response.status_code == 403
