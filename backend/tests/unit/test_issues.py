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
        json={"name": "Issue Project"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


def test_create_issue(client, owner_token, project_id):
    response = client.post(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
        json={"title": "Corrigir bug", "priority": "high"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Corrigir bug"
    assert data["status"] == "backlog"
    assert data["priority"] == "high"


def test_move_issue_to_done_sets_closed_at(client, owner_token, project_id):
    issue = client.post(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
        json={"title": "Tarefa"},
    ).json()
    assert issue["closed_at"] is None

    response = client.patch(
        f"/api/v1/projects/{project_id}/issues/{issue['id']}",
        headers=auth_header(owner_token),
        json={"status": "done"},
    )
    assert response.status_code == 200
    assert response.json()["closed_at"] is not None


def test_reopen_issue_clears_closed_at(client, owner_token, project_id):
    issue = client.post(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
        json={"title": "Tarefa", "status": "done"},
    ).json()
    assert issue["closed_at"] is not None

    response = client.patch(
        f"/api/v1/projects/{project_id}/issues/{issue['id']}",
        headers=auth_header(owner_token),
        json={"status": "todo"},
    )
    assert response.json()["closed_at"] is None


def test_list_issues(client, owner_token, project_id):
    for i in range(3):
        client.post(
            f"/api/v1/projects/{project_id}/issues",
            headers=auth_header(owner_token),
            json={"title": f"Tarefa {i}"},
        )
    response = client.get(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
    )
    assert len(response.json()) == 3


def test_filter_issues_by_status(client, owner_token, project_id):
    client.post(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
        json={"title": "A", "status": "todo"},
    )
    client.post(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
        json={"title": "B", "status": "done"},
    )
    response = client.get(
        f"/api/v1/projects/{project_id}/issues?status_filter=done",
        headers=auth_header(owner_token),
    )
    assert len(response.json()) == 1
    assert response.json()[0]["title"] == "B"


def test_outsider_cannot_access_issues(client, outsider_token, project_id):
    response = client.get(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(outsider_token),
    )
    assert response.status_code == 403


def test_delete_issue(client, owner_token, project_id):
    issue = client.post(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
        json={"title": "Deletar"},
    ).json()
    response = client.delete(
        f"/api/v1/projects/{project_id}/issues/{issue['id']}",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 204

    response = client.get(
        f"/api/v1/projects/{project_id}/issues",
        headers=auth_header(owner_token),
    )
    assert len(response.json()) == 0
