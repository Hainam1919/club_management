"""
Tests cho clubs router — list, create, detail, search.
"""
import pytest
from fastapi import status
from datetime import datetime


class TestClubs:
    """Tests cho club management endpoints."""

    def test_list_clubs_empty(self, client, db_session):
        """Danh sách CLB khi chưa có dữ liệu."""
        response = client.get("/api/clubs")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_list_clubs_with_data(self, client, db_session, leader_user):
        """Danh sách CLB có dữ liệu mẫu."""
        from app.models import Club
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Test",
            slug=slugify("CLB Test"),
            description="CLB dùng cho test",
            category="Học thuật",
            member_count=10,
            ai_summary="Test summary",
            ai_tags="test, hoc-tap",
            president_id=leader_user.id,
            email="clbtest@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        response = client.get("/api/clubs")
        assert response.status_code == status.HTTP_200_OK
        clubs = response.json()
        assert len(clubs) >= 1
        assert clubs[0]["name"] == "CLB Test"

    def test_list_clubs_with_search(self, client, db_session, leader_user):
        """Tìm kiếm CLB theo từ khóa."""
        from app.models import Club
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Lập trình",
            slug=slugify("CLB Lập trình"),
            description="CLB lập trình web",
            category="Học thuật",
            member_count=50,
            president_id=leader_user.id,
            email="clblap@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()

        response = client.get("/api/clubs?q=lập trình")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 1

    def test_list_clubs_with_category_filter(self, client, db_session, leader_user):
        """Lọc CLB theo category."""
        from app.models import Club
        from app.routers.clubs import slugify

        club1 = Club(
            name="CLB Thể thao",
            slug=slugify("CLB Thể thai"),
            description="Bóng đá",
            category="Thể thao",
            member_count=30,
            president_id=leader_user.id,
            email="clbsport@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        club2 = Club(
            name="CLB Học thuật",
            slug=slugify("CLB Học thuật"),
            description="Lập trình",
            category="Học thuật",
            member_count=20,
            president_id=leader_user.id,
            email="clbstudy@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club1)
        db_session.add(club2)
        db_session.commit()

        response = client.get("/api/clubs?category=Thể thao")
        assert response.status_code == status.HTTP_200_OK
        clubs = response.json()
        assert all(c["category"] == "Thể thao" for c in clubs)

    def test_get_club_detail(self, client, db_session, leader_user):
        """Xem chi tiết CLB."""
        from app.models import Club
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Chi Tiết",
            slug=slugify("CLB Chi Tiết"),
            description="Mô tả chi tiết CLB test",
            category="Văn nghệ",
            member_count=45,
            ai_summary="Đây là summary test",
            ai_tags="test, van-nghe",
            president_id=leader_user.id,
            email="clbdetail@ictu.edu.vn",
            facebook="https://facebook.com/clbdetail",
            mission="Sứ mệnh test",
            vision="Tầm nhìn test",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        response = client.get(f"/api/clubs/{club.slug}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "CLB Chi Tiết"
        assert data["member_count"] == 45
        assert data["ai_summary"] == "Đây là summary test"

    def test_get_club_not_found(self, client):
        """Xem CLB không tồn tại."""
        response = client.get("/api/clubs/club-khong-ton-tai")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_club_as_leader(self, client, db_session, leader_user):
        """Leader tạo CLB mới."""
        headers = {}
        from app.security import create_access_token
        token = create_access_token({"sub": str(leader_user.id), "role": "leader"})
        headers["Authorization"] = f"Bearer {token}"

        response = client.post(
            "/api/clubs",
            headers=headers,
            json={
                "name": "CLB Mới",
                "description": "Mô tả CLB mới",
                "category": "Kỹ năng",
                "email": "clbmoi@ictu.edu.vn",
            },
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["name"] == "CLB Mới"

    def test_create_club_without_auth(self, client):
        """Không auth - không thể tạo CLB."""
        response = client.post(
            "/api/clubs",
            json={
                "name": "CLB Không Auth",
                "description": "Test",
                "category": "Kỹ năng",
                "email": "noauth@ictu.edu.vn",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_join_club(self, client, db_session, regular_user, leader_user):
        """Tham gia CLB."""
        from app.models import Club, Membership
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Join Test",
            slug=slugify("CLB Join Test"),
            description="Test join",
            category="Học thuật",
            member_count=10,
            president_id=leader_user.id,
            email="join@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        from app.security import create_access_token
        token = create_access_token({"sub": str(regular_user.id), "role": "member"})
        headers = {"Authorization": f"Bearer {token}"}

        response = client.post(f"/api/clubs/{club.slug}/join", headers=headers)
        assert response.status_code == status.HTTP_200_OK

        # Kiểm tra membership đã được tạo
        membership = db_session.query(Membership).filter(
            Membership.user_id == regular_user.id,
            Membership.club_id == club.id,
        ).first()
        assert membership is not None
        assert membership.is_active is True

        # ===== NEW TESTS =====

    def test_join_then_leave_club(self, client, db_session, regular_user, leader_user):
        """Member tham gia rồi rời CLB."""
        from app.models import Club, Membership
        from app.routers.clubs import slugify
        from app.security import create_access_token

        club = Club(
            name="CLB Leave Test",
            slug=slugify("CLB Leave Test"),
            description="Test leave",
            category="Học thuật",
            member_count=5,
            president_id=leader_user.id,
            email="leave@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        token = create_access_token({"sub": str(regular_user.id), "role": "member"})
        headers = {"Authorization": f"Bearer {token}"}

        # Join
        resp = client.post(f"/api/clubs/{club.slug}/join", headers=headers)
        assert resp.status_code == status.HTTP_200_OK

        # Leave
        resp = client.post(f"/api/clubs/{club.slug}/leave", headers=headers)
        assert resp.status_code == status.HTTP_200_OK
        assert "rời" in resp.json()["message"].lower()

        # Membership đã bị vô hiệu hoá
        membership = db_session.query(Membership).filter(
            Membership.user_id == regular_user.id,
            Membership.club_id == club.id,
        ).first()
        assert membership.is_active is False

    def test_leave_club_as_president_forbidden(self, client, db_session, leader_user):
        """Chủ nhiệm không thể rời CLB."""
        from app.models import Club, Membership
        from app.routers.clubs import slugify
        from app.security import create_access_token

        club = Club(
            name="CLB President Leave",
            slug=slugify("CLB President Leave"),
            description="Test president leave",
            category="Thể thao",
            member_count=10,
            president_id=leader_user.id,
            email="president-leave@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        # Add president membership
        membership = Membership(user_id=leader_user.id, club_id=club.id, role="president")
        db_session.add(membership)
        db_session.commit()

        token = create_access_token({"sub": str(leader_user.id), "role": "leader"})
        headers = {"Authorization": f"Bearer {token}"}

        # President tries to leave
        resp = client.post(f"/api/clubs/{club.slug}/leave", headers=headers)
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "chủ nhiệm" in resp.json()["detail"].lower()

    def test_get_club_by_integer_id(self, client, db_session, leader_user):
        """Lấy CLB bằng ID số (tương thích frontend)."""
        from app.models import Club
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Integer ID",
            slug=slugify("CLB Integer ID"),
            description="Test integer ID lookup",
            category="Học thuật",
            member_count=20,
            president_id=leader_user.id,
            email="intid@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        # Lookup by integer ID trực tiếp trong path
        response = client.get(f"/api/clubs/{club.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "CLB Integer ID"
        assert data["id"] == club.id

    def test_get_club_by_slug(self, client, db_session, leader_user):
        """Lấy CLB bằng slug."""
        from app.models import Club
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Slug Lookup",
            slug=slugify("CLB Slug Lookup"),
            description="Test slug lookup",
            category="Văn nghệ",
            member_count=15,
            president_id=leader_user.id,
            email="slugtest@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        response = client.get(f"/api/clubs/{club.slug}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "CLB Slug Lookup"

    def test_get_club_members_by_slug(self, client, db_session, regular_user, leader_user):
        """Lấy danh sách thành viên CLB bằng slug."""
        from app.models import Club, Membership
        from app.routers.clubs import slugify

        club = Club(
            name="CLB Members Slug",
            slug=slugify("CLB Members Slug"),
            description="Test members by slug",
            category="Kỹ năng",
            member_count=2,
            president_id=leader_user.id,
            email="memberslug@ictu.edu.vn",
            is_active=True,
            is_public=True,
        )
        db_session.add(club)
        db_session.commit()
        db_session.refresh(club)

        # Add president membership
        pres_membership = Membership(user_id=leader_user.id, club_id=club.id, role="president")
        db_session.add(pres_membership)
        db_session.commit()

        # Add regular_user as member
        membership = Membership(user_id=regular_user.id, club_id=club.id, role="member")
        db_session.add(membership)
        db_session.commit()

        response = client.get(f"/api/clubs/{club.slug}/members")
        assert response.status_code == status.HTTP_200_OK
        members = response.json()
        assert len(members) == 2  # leader_user (president) + regular_user
        assert any(m["user_id"] == regular_user.id for m in members)
