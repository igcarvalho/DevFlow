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
def other_token(client):
    return register_and_login(client, "other@example.com", "Other User")


@pytest.fixture
def project_id(client, owner_token):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Test Project", "description": "A test project"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


def test_create_project(client, owner_token):
    response = client.post(
        "/api/v1/projects",
        json={"name": "My Project", "description": "Desc"},
        headers=auth_header(owner_token),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Project"
    assert "id" in data


def test_list_projects_only_own(client, owner_token, other_token, project_id):
    response = client.get("/api/v1/projects", headers=auth_header(owner_token))
    assert len(response.json()) == 1

    response = client.get("/api/v1/projects", headers=auth_header(other_token))
    assert len(response.json()) == 0


def test_get_project_forbidden_for_non_member(client, other_token, project_id):
    response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_header(other_token)
    )
    assert response.status_code == 403


def test_add_member(client, owner_token, other_token, project_id):
    response = client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "other@example.com", "role": "member"},
        headers=auth_header(owner_token),
    )
    assert response.status_code == 201

    response = client.get("/api/v1/projects", headers=auth_header(other_token))
    assert len(response.json()) == 1


def test_member_cannot_add_members(client, owner_token, other_token, project_id):
    client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "other@example.com", "role": "member"},
        headers=auth_header(owner_token),
    )
    register_and_login(client, "third@example.com", "Third User")
    response = client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "third@example.com", "role": "member"},
        headers=auth_header(other_token),
    )
    assert response.status_code == 403


def test_update_project_requires_admin(client, owner_token, other_token, project_id):
    client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"email": "other@example.com", "role": "member"},
        headers=auth_header(owner_token),
    )
    response = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Renamed"},
        headers=auth_header(other_token),
    )
    assert response.status_code == 403

    response = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Renamed"},
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Renamed"


def test_delete_project_requires_owner(client, owner_token, project_id):
    response = client.delete(
        f"/api/v1/projects/{project_id}", headers=auth_header(owner_token)
    )
    assert response.status_code == 204

    response = client.get("/api/v1/projects", headers=auth_header(owner_token))
    assert len(response.json()) == 0


def test_cannot_remove_owner(client, owner_token, project_id):
    project = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_header(owner_token)
    ).json()
    owner_id = project["owner_id"]
    response = client.delete(
        f"/api/v1/projects/{project_id}/members/{owner_id}",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 400
