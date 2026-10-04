from unittest.mock import patch

import pytest


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
        json={"name": "AI Project"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


@pytest.fixture
def document_id(client, owner_token, project_id):
    import io

    from pypdf import PdfWriter

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
            data={"title": "Doc IA"},
        )
    return response.json()["id"]


def test_ai_unavailable_without_key(client, owner_token, project_id, document_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", ""):
        response = client.post(
            f"/api/v1/projects/{project_id}/ai/summarize",
            headers=auth_header(owner_token),
            json={"document_id": document_id},
        )
    assert response.status_code == 503


def test_summarize_creates_job(client, owner_token, project_id, document_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", "sk-test"), patch(
        "app.api.v1.ai.process_ai_job.delay"
    ) as delay_mock:
        response = client.post(
            f"/api/v1/projects/{project_id}/ai/summarize",
            headers=auth_header(owner_token),
            json={"document_id": document_id},
        )
    assert response.status_code == 202
    data = response.json()
    assert data["type"] == "summarize"
    assert data["status"] == "pending"
    delay_mock.assert_called_once()


def test_ask_creates_job(client, owner_token, project_id, document_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", "sk-test"), patch(
        "app.api.v1.ai.process_ai_job.delay"
    ):
        response = client.post(
            f"/api/v1/projects/{project_id}/ai/ask",
            headers=auth_header(owner_token),
            json={"document_id": document_id, "question": "Do que se trata?"},
        )
    assert response.status_code == 202
    assert response.json()["type"] == "ask"
    assert response.json()["input_data"]["question"] == "Do que se trata?"


def test_suggest_tasks_creates_job(client, owner_token, project_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", "sk-test"), patch(
        "app.api.v1.ai.process_ai_job.delay"
    ):
        response = client.post(
            f"/api/v1/projects/{project_id}/ai/suggest-tasks",
            headers=auth_header(owner_token),
        )
    assert response.status_code == 202
    assert response.json()["type"] == "suggest_tasks"


def test_list_and_get_jobs(client, owner_token, project_id, document_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", "sk-test"), patch(
        "app.api.v1.ai.process_ai_job.delay"
    ):
        job = client.post(
            f"/api/v1/projects/{project_id}/ai/summarize",
            headers=auth_header(owner_token),
            json={"document_id": document_id},
        ).json()

    response = client.get(
        f"/api/v1/projects/{project_id}/ai/jobs",
        headers=auth_header(owner_token),
    )
    assert len(response.json()) == 1

    response = client.get(
        f"/api/v1/projects/{project_id}/ai/jobs/{job['id']}",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert response.json()["id"] == job["id"]


def test_outsider_cannot_use_ai(client, outsider_token, project_id, document_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", "sk-test"), patch(
        "app.api.v1.ai.process_ai_job.delay"
    ):
        response = client.post(
            f"/api/v1/projects/{project_id}/ai/summarize",
            headers=auth_header(outsider_token),
            json={"document_id": document_id},
        )
    assert response.status_code == 403


def test_summarize_unknown_document(client, owner_token, project_id):
    with patch("app.api.v1.ai.settings.OPENAI_API_KEY", "sk-test"), patch(
        "app.api.v1.ai.process_ai_job.delay"
    ):
        response = client.post(
            f"/api/v1/projects/{project_id}/ai/summarize",
            headers=auth_header(owner_token),
            json={"document_id": "00000000-0000-0000-0000-000000000000"},
        )
    assert response.status_code == 404
