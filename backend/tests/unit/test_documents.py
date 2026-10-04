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


def make_pdf_bytes() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=612, height=792)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


@pytest.fixture
def owner_token(client):
    return register_and_login(client, "owner@example.com", "Owner User")


@pytest.fixture
def other_token(client):
    return register_and_login(client, "other@example.com", "Other User")


@pytest.fixture
def project_id(client, owner_token):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Doc Project", "description": "Docs"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


@pytest.fixture(autouse=True)
def mock_storage_and_tasks():
    with patch("app.api.v1.documents.upload_file") as upload_mock, patch(
        "app.api.v1.documents.generate_presigned_url", return_value="http://fake-url"
    ), patch(
        "app.api.v1.documents.download_file", return_value=b"%PDF-1.4 fake"
    ), patch("app.api.v1.documents.process_document_version.delay") as delay_mock:
        yield {"upload": upload_mock, "delay": delay_mock}


def upload_document(client, token, project_id, filename="test.pdf", title="Doc"):
    return client.post(
        f"/api/v1/projects/{project_id}/documents",
        headers=auth_header(token),
        files={"file": (filename, make_pdf_bytes(), "application/pdf")},
        data={"title": title},
    )


def test_upload_document(client, owner_token, project_id, mock_storage_and_tasks):
    response = upload_document(client, owner_token, project_id)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Doc"
    assert data["status"] == "pending"
    assert data["current_version_id"] is not None
    mock_storage_and_tasks["upload"].assert_called_once()
    mock_storage_and_tasks["delay"].assert_called_once()


def test_upload_rejects_invalid_mime(client, owner_token, project_id):
    response = client.post(
        f"/api/v1/projects/{project_id}/documents",
        headers=auth_header(owner_token),
        files={"file": ("test.txt", b"hello", "text/plain")},
        data={"title": "Bad"},
    )
    assert response.status_code == 400


def test_upload_requires_membership(client, other_token, project_id):
    response = upload_document(client, other_token, project_id)
    assert response.status_code == 403


def test_list_documents(client, owner_token, project_id, mock_storage_and_tasks):
    upload_document(client, owner_token, project_id, title="Doc A")
    upload_document(client, owner_token, project_id, title="Doc B")
    response = client.get(
        f"/api/v1/projects/{project_id}/documents",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_document_with_versions(client, owner_token, project_id, mock_storage_and_tasks):
    doc_id = upload_document(client, owner_token, project_id).json()["id"]
    response = client.get(
        f"/api/v1/projects/{project_id}/documents/{doc_id}",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["versions"]) == 1
    assert data["versions"][0]["version_number"] == 1


def test_upload_new_version(client, owner_token, project_id, mock_storage_and_tasks):
    doc_id = upload_document(client, owner_token, project_id).json()["id"]
    response = client.post(
        f"/api/v1/projects/{project_id}/documents/{doc_id}/versions",
        headers=auth_header(owner_token),
        files={"file": ("v2.pdf", make_pdf_bytes(), "application/pdf")},
    )
    assert response.status_code == 201
    assert response.json()["version_number"] == 2

    detail = client.get(
        f"/api/v1/projects/{project_id}/documents/{doc_id}",
        headers=auth_header(owner_token),
    ).json()
    assert len(detail["versions"]) == 2


def test_update_document(client, owner_token, project_id, mock_storage_and_tasks):
    doc_id = upload_document(client, owner_token, project_id).json()["id"]
    response = client.patch(
        f"/api/v1/projects/{project_id}/documents/{doc_id}",
        headers=auth_header(owner_token),
        json={"title": "Novo título", "description": "Nova descrição"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Novo título"


def test_soft_delete_document(client, owner_token, project_id, mock_storage_and_tasks):
    doc_id = upload_document(client, owner_token, project_id).json()["id"]
    response = client.delete(
        f"/api/v1/projects/{project_id}/documents/{doc_id}",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 204

    response = client.get(
        f"/api/v1/projects/{project_id}/documents",
        headers=auth_header(owner_token),
    )
    assert len(response.json()) == 0


def test_download_url(client, owner_token, project_id, mock_storage_and_tasks):
    doc = upload_document(client, owner_token, project_id).json()
    version_id = doc["current_version_id"]
    response = client.get(
        f"/api/v1/projects/{project_id}/documents/{doc['id']}/versions/{version_id}/download",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert response.json()["download_url"] == "http://fake-url"


def test_list_includes_mime_type(client, owner_token, project_id, mock_storage_and_tasks):
    upload_document(client, owner_token, project_id)
    response = client.get(
        f"/api/v1/projects/{project_id}/documents",
        headers=auth_header(owner_token),
    )
    assert response.json()[0]["mime_type"] == "application/pdf"


def test_stream_file_with_header(client, owner_token, project_id, mock_storage_and_tasks):
    doc = upload_document(client, owner_token, project_id).json()
    response = client.get(
        f"/api/v1/projects/{project_id}/documents/{doc['id']}/versions/{doc['current_version_id']}/file",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert response.content == b"%PDF-1.4 fake"


def test_stream_file_with_query_token(client, owner_token, project_id, mock_storage_and_tasks):
    doc = upload_document(client, owner_token, project_id).json()
    response = client.get(
        f"/api/v1/projects/{project_id}/documents/{doc['id']}/versions/{doc['current_version_id']}/file?token={owner_token}",
    )
    assert response.status_code == 200


def test_stream_file_requires_auth(client, project_id, mock_storage_and_tasks, owner_token):
    doc = upload_document(client, owner_token, project_id).json()
    response = client.get(
        f"/api/v1/projects/{project_id}/documents/{doc['id']}/versions/{doc['current_version_id']}/file",
    )
    assert response.status_code == 401
