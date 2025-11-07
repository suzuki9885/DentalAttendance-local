import sys
import os
# プロジェクトルートディレクトリを取得 (例: /Users/suzukiken/Desktop/勤怠管理システム)
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# DentalAttendance ディレクトリのパスを構築
dental_attendance_dir = os.path.join(project_root, 'DentalAttendance')

# sys.path の先頭に追加 (優先度を高くする)
if dental_attendance_dir not in sys.path:
    sys.path.insert(0, dental_attendance_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root) # testapp がルート直下にある場合も考慮（今回のケースではDentalAttendance内）

import pytest
from flask import session # session を直接インポート
from testapp import app, db
from testapp.models import User
from werkzeug.security import generate_password_hash
from testapp.config import ADMIN_ID, ADMIN_PASSWORD # 管理者IDとパスワードをインポート

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:' # テスト用インメモリDB
    app.config['SECRET_KEY'] = 'test_secret_key' # テスト用のシークレットキー
    app.config['WTF_CSRF_ENABLED'] = False # CSRF保護をテスト中は無効化

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # テスト用FT従業員
            hashed_password_ft = generate_password_hash('passwordFT', method='pbkdf2:sha256')
            ft_user = User(employee_id='FT001', name='Test User FT', employment_type='FT', password=hashed_password_ft)
            db.session.add(ft_user)

            # テスト用PT従業員
            hashed_password_pt = generate_password_hash('passwordPT', method='pbkdf2:sha256')
            pt_user = User(employee_id='PT001', name='Test User PT', employment_type='PT', password=hashed_password_pt)
            db.session.add(pt_user)

            db.session.commit()
        yield client
        with app.app_context():
            db.drop_all()

def test_admin_login_success(client):
    """管理者の正常なログインをテストします。"""
    response = client.post('/adm_login', data={
        'adm_id': ADMIN_ID,
        'adm_password': ADMIN_PASSWORD
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<h1 class="management-title">管理</h1>'.encode('utf-8') in response.data
    with client.session_transaction() as sess:
        assert sess.get('adm_logged_in') is True

def test_admin_login_fail_wrong_password(client):
    """管理者のパスワード間違いによるログイン失敗をテストします。"""
    response = client.post('/adm_login', data={
        'adm_id': ADMIN_ID,
        'adm_password': 'wrongpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠管理システム 管理者ログイン</title>'.encode('utf-8') in response.data 
    with client.session_transaction() as sess:
        assert sess.get('adm_logged_in') is None

def test_admin_login_fail_wrong_id(client):
    """管理者のID間違いによるログイン失敗をテストします。"""
    response = client.post('/adm_login', data={
        'adm_id': 'wrongadmin',
        'adm_password': ADMIN_PASSWORD
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠管理システム 管理者ログイン</title>'.encode('utf-8') in response.data
    with client.session_transaction() as sess:
        assert sess.get('adm_logged_in') is None

def test_admin_login_fail_empty_credentials(client):
    """管理者のIDとパスワードが空の場合のログイン失敗をテストします。"""
    response = client.post('/adm_login', data={
        'adm_id': '',
        'adm_password': ''
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠管理システム 管理者ログイン</title>'.encode('utf-8') in response.data
    with client.session_transaction() as sess:
        assert sess.get('adm_logged_in') is None

# --- 従業員ログインのテスト --- 
def test_employee_login_success_ft(client):
    """正社員(FT)の正常なログインとリダイレクトをテストします。"""
    with app.app_context():
        ft_user_in_db = User.query.filter_by(employee_id='FT001').first()
        assert ft_user_in_db is not None, "Test FT user should exist in DB"
        ft_user_id = ft_user_in_db.id

    response = client.post('/employee_login', data={
        'employee_id': 'FT001',
        'password': 'passwordFT'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠登録 正社員</title>'.encode('utf-8') in response.data

    with client.session_transaction() as sess:
        assert sess.get('user_id') == ft_user_id
        assert sess.get('employee_id') == 'FT001'
        assert sess.get('employment_type') == 'FT'
        assert sess.get('name') == 'Test User FT'

def test_employee_login_success_pt(client):
    """パート(PT)の正常なログインとリダイレクトをテストします。"""
    with app.app_context():
        pt_user_in_db = User.query.filter_by(employee_id='PT001').first()
        assert pt_user_in_db is not None, "Test PT user should exist in DB"
        pt_user_id = pt_user_in_db.id

    response = client.post('/employee_login', data={
        'employee_id': 'PT001',
        'password': 'passwordPT'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠登録 パート</title>'.encode('utf-8') in response.data

    with client.session_transaction() as sess:
        assert sess.get('user_id') == pt_user_id
        assert sess.get('employee_id') == 'PT001'
        assert sess.get('employment_type') == 'PT'
        assert sess.get('name') == 'Test User PT'

def test_employee_login_fail_nonexistent_id(client):
    """存在しない従業員IDでのログイン失敗をテストします。"""
    response = client.post('/employee_login', data={
        'employee_id': 'XX999', # 存在しないID
        'password': 'anypassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠管理システム 従業員ログイン</title>'.encode('utf-8') in response.data
    with client.session_transaction() as sess:
        assert 'user_id' not in sess

def test_employee_login_fail_wrong_password(client):
    """従業員のパスワード間違いによるログイン失敗をテストします。"""
    response = client.post('/employee_login', data={
        'employee_id': 'FT001', # 存在するFTユーザーのID
        'password': 'wrongpassword'
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠管理システム 従業員ログイン</title>'.encode('utf-8') in response.data
    with client.session_transaction() as sess:
        assert 'user_id' not in sess

def test_employee_login_fail_empty_credentials(client):
    """従業員IDとパスワードが空の場合のログイン失敗をテストします。"""
    response = client.post('/employee_login', data={
        'employee_id': '',
        'password': ''
    }, follow_redirects=True)
    assert response.status_code == 200
    assert '<title>勤怠管理システム 従業員ログイン</title>'.encode('utf-8') in response.data
    with client.session_transaction() as sess:
        assert 'user_id' not in sess

# --- ここから従業員ログイン失敗ケースのテストを追加していく --- 