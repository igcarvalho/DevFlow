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
def member_token(client):
    return register_and_login(client, "member@example.com", "Member User")


@pytest.fixture
def outsider_token(client):
    return register_and_login(client, "outsider@example.com", "Outsider User")


@pytest.fixture
def project_id(client, owner_token):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Annotation Project"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


@pytest.fixture
def document(client, owner_token, project_id):
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = io.BytesIO()
    writer.write(buffer)
    with patch("app.api.v1.documents.upload_file"), patch(
        "app.api.v1.documents.process_document_version.delay"
    ):
        response = client.post(
            f"/api/v1/projects/{project_id}/documents",
            headers=auth_header(owner_token),
            files={"file": ("doc.pdf", buffer.getvalue(), "application/pdf")},
            data={"title": "Doc"},
        )
    return response.json()


def test_create_annotation(client, owner_token, project_id, document):
    response = client.post(
        f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations",
        headers=auth_header(owner_token),
        json={
            "version_id": document["current_version_id"],
            "page_number": 1,
            "type": "note",
            "content": "Revisar esta seção",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "Revisar esta seção"
    assert data["page_number"] == 1
    assert data["author_name"] == "Owner User"


def test_list_and_filter_annotations(client, owner_token, project_id, document):
    base = f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations"
    for page in (1, 2, 2):
        client.post(
            base,
            headers=auth_header(owner_token),
            json={
                "version_id": document["current_version_id"],
                "page_number": page,
                "content": f"Nota na página {page}",
            },
        )

    response = client.get(base, headers=auth_header(owner_token))
    assert len(response.json()) == 3

    response = client.get(f"{base}?page_number=2", headers=auth_header(owner_token))
    assert len(response.json()) == 2


def test_update_own_annotation(client, owner_token, project_id, document):
    base = f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations"
    annotation = client.post(
        base,
        headers=auth_header(owner_token),
        json={
            "version_id": document["current_version_id"],
            "content": "Original",
        },
    ).json()

    response = client.patch(
        f"{base}/{annotation['id']}",
        headers=auth_header(owner_token),
        json={"content": "Atualizada"},
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Atualizada"


def test_delete_own_annotation(client, owner_token, project_id, document):
    base = f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations"
    annotation = client.post(
        base,
        headers=auth_header(owner_token),
        json={
            "version_id": document["current_version_id"],
            "content": "Para deletar",
        },
    ).json()

    response = client.delete(
        f"{base}/{annotation['id']}", headers=auth_header(owner_token)
    )
    assert response.status_code == 204

    response = client.get(base, headers=auth_header(owner_token))
    assert len(response.json()) == 0


def test_member_cannot_delete_others_annotation(
    client, owner_token, member_token, project_id, document
):
    client.post(
        f"/api/v1/projects/{project_id}/members",
        headers=auth_header(owner_token),
        json={"email": "member@example.com", "role": "member"},
    )
    base = f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations"
    annotation = client.post(
        base,
        headers=auth_header(owner_token),
        json={
            "version_id": document["current_version_id"],
            "content": "Do dono",
        },
    ).json()

    response = client.delete(
        f"{base}/{annotation['id']}", headers=auth_header(member_token)
    )
    assert response.status_code == 403


def test_invalid_version_rejected(client, owner_token, project_id, document):
    response = client.post(
        f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations",
        headers=auth_header(owner_token),
        json={
            "version_id": "00000000-0000-0000-0000-000000000000",
            "content": "Inválida",
        },
    )
    assert response.status_code == 400


def test_outsider_cannot_access_annotations(
    client, outsider_token, project_id, document
):
    response = client.get(
        f"/api/v1/projects/{project_id}/documents/{document['id']}/annotations",
        headers=auth_header(outsider_token),
    )
    assert response.status_code == 403
