"""
Tests cho auth router — registration, login, profile management.
"""
import pytest
from fastapi import status


class TestAuth:
    """Tests cho authentication endpoints."""

    def test_login_success(self, client, regular_user):
        """Đăng nhập thành công với credentials hợp lệ."""
        response = client.post(
            "/api/auth/login",
            data={
                "username": regular_user.username,
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["user"]["username"] == regular_user.username
        assert data["user"]["role"] == "member"

    def test_login_invalid_password(self, client, regular_user):
        """Đăng nhập thất bại với mật khẩu sai."""
        response = client.post(
            "/api/auth/login",
            data={
                "username": regular_user.username,
                "password": "wrongpassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "không đúng" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Đăng nhập thất bại với user không tồn tại."""
        response = client.post(
            "/api/auth/login",
            data={"username": "nonexistent", "password": "password"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_json_success(self, client, regular_user):
        """Đăng nhập qua JSON endpoint thành công."""
        response = client.post(
            "/api/auth/login-json",
            json={
                "username": regular_user.username,
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()

    def test_register_success(self, client):
        """Đăng ký tài khoản mới thành công."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@ictu.edu.vn",
                "full_name": "Người dùng Mới",
                "password": "password123",
                "student_id": "SV2024999",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "access_token" in data
        assert data["user"]["username"] == "newuser"

    def test_register_duplicate_username(self, client, regular_user):
        """Đăng ký thất bại khi username đã tồn tại."""
        response = client.post(
            "/api/auth/register",
            json={
                "username": regular_user.username,
                "email": "another@ictu.edu.vn",
                "full_name": "Test",
                "password": "password123",
                "student_id": "SV002",
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "đã tồn tại" in response.json()["detail"]

    def test_get_me_authenticated(self, client, auth_headers):
        """Lấy thông tin user hiện tại khi đã đăng nhập."""
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "testuser"

    def test_get_me_unauthenticated(self, client):
        """Lấy thông tin user khi chưa đăng nhập — trả về 200 với null."""
        # get_current_user trả về None nếu không có token
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self, client, auth_headers):
        """Cập nhật thông tin cá nhân."""
        response = client.put(
            "/api/auth/me",
            headers=auth_headers,
            json={"full_name": "Updated Name", "phone": "0999999999"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["phone"] == "0999999999"

    def test_change_password_success(self, client, auth_headers):
        """Đổi mật khẩu thành công."""
        response = client.post(
            "/api/auth/change-password",
            headers=auth_headers,
            json={"old_password": "password123", "new_password": "newpass456"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert "thành công" in response.json()["message"].lower()

    def test_change_password_wrong_old(self, client, auth_headers):
        """Đổi mật khẩu với mật khẩu cũ sai."""
        response = client.post(
            "/api/auth/change-password",
            headers=auth_headers,
            json={"old_password": "wrongold", "new_password": "newpass456"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_health_endpoint(self, client):
        """Health check endpoint."""
        response = client.get("/health")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
