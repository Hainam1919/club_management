"""
Test configuration & shared fixtures cho hệ thống CLB.
Sử dụng SQLite in-memory database để test nhanh và độc lập.
"""
import os
import sys

# Ensure test secret key is present before any app import
os.environ.setdefault("SECRET_KEY", "test-secret-key-123456789012345678901234")
os.environ.setdefault("APP_ENV", "test")

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Generator
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.models import User
from app.security import hash_password
from app.main import app

# --- Test Database (SQLite in-memory) ---
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


# --- Override get_db dependency ---
@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Tạo database session mới cho mỗi test, tự động rollback."""
    Base.metadata.create_all(bind=test_engine)
    connection = test_engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(bind=connection)
    yield session

    session.close()
    transaction.rollback()
    connection.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """FastAPI test client với database được override."""
    app.dependency_overrides[get_db] = lambda: db_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    """Tạo admin user cho tests."""
    admin = User(
        username="testadmin",
        email="testadmin@ictu.edu.vn",
        full_name="Test Admin",
        hashed_password=hash_password("admin123"),
        role="admin",
        faculty="Ban Quản lý Sinh viên",
        student_id="ADMIN_TEST",
        is_active=True,
        is_public=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    """Tạo regular member user cho tests."""
    user = User(
        username="testuser",
        email="testuser@ictu.edu.vn",
        full_name="Test User",
        hashed_password=hash_password("password123"),
        role="member",
        faculty="Công nghệ Thông tin",
        student_id="SV2024001",
        class_name="DHTI2024A1",
        phone="0123456789",
        is_active=True,
        is_public=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def leader_user(db_session) -> User:
    """Tạo leader user cho tests."""
    user = User(
        username="testleader",
        email="testleader@ictu.edu.vn",
        full_name="Test Leader",
        hashed_password=hash_password("leader123"),
        role="leader",
        faculty="Công nghệ Thông tin",
        student_id="SV2024002",
        class_name="DHTI2024A2",
        phone="0987654321",
        is_active=True,
        is_public=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client, regular_user):
    """Return auth headers for a regular user."""
    response = client.post(
        "/api/auth/login",
        data={"username": regular_user.username, "password": "password123"},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers(client, admin_user):
    """Return auth headers for an admin user."""
    response = client.post(
        "/api/auth/login",
        data={"username": admin_user.username, "password": "admin123"},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
