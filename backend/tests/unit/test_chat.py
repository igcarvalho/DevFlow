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
def member_token(client):
    return register_and_login(client, "member@example.com", "Member User")


@pytest.fixture
def outsider_token(client):
    return register_and_login(client, "outsider@example.com", "Outsider User")


@pytest.fixture
def project_id(client, owner_token):
    response = client.post(
        "/api/v1/projects",
        json={"name": "Chat Project", "description": "Chat"},
        headers=auth_header(owner_token),
    )
    return response.json()["id"]


def test_chat_created_with_project(client, owner_token, project_id):
    response = client.get(
        f"/api/v1/projects/{project_id}/chat",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 200
    assert response.json()["project_id"] == project_id


def test_send_and_list_messages(client, owner_token, project_id):
    response = client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Olá, pessoal!"},
    )
    assert response.status_code == 201
    assert response.json()["content"] == "Olá, pessoal!"
    assert response.json()["sender_name"] == "Owner User"

    response = client.get(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
    )
    assert len(response.json()) == 1


def test_reply_to_message(client, owner_token, project_id):
    first = client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Mensagem original"},
    ).json()

    response = client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Resposta", "reply_to_id": first["id"]},
    )
    assert response.status_code == 201
    assert response.json()["reply_to_id"] == first["id"]


def test_outsider_cannot_access_chat(client, outsider_token, project_id):
    response = client.get(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(outsider_token),
    )
    assert response.status_code == 403


def test_member_can_send(client, owner_token, member_token, project_id):
    client.post(
        f"/api/v1/projects/{project_id}/members",
        headers=auth_header(owner_token),
        json={"email": "member@example.com", "role": "member"},
    )
    response = client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(member_token),
        json={"content": "Oi, sou membro"},
    )
    assert response.status_code == 201


def test_delete_own_message(client, owner_token, project_id):
    message = client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Para deletar"},
    ).json()

    response = client.delete(
        f"/api/v1/projects/{project_id}/chat/messages/{message['id']}",
        headers=auth_header(owner_token),
    )
    assert response.status_code == 204

    messages = client.get(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
    ).json()
    assert len(messages) == 0


def test_member_cannot_delete_others_message(
    client, owner_token, member_token, project_id
):
    client.post(
        f"/api/v1/projects/{project_id}/members",
        headers=auth_header(owner_token),
        json={"email": "member@example.com", "role": "member"},
    )
    message = client.post(
        f"/api/v1/projects/{project_id}/chat/messages",
        headers=auth_header(owner_token),
        json={"content": "Mensagem do dono"},
    ).json()

    response = client.delete(
        f"/api/v1/projects/{project_id}/chat/messages/{message['id']}",
        headers=auth_header(member_token),
    )
    assert response.status_code == 403
