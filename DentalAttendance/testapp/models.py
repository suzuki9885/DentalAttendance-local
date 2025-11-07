from datetime import datetime
from testapp import db

class User(db.Model):
    __tablename__ = 'users'  # テーブル名を明示的に指定
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)  # 20文字まで
    employment_type = db.Column(db.String(2), nullable=False)  # FTまたはPT（2文字）
    employee_id = db.Column(db.String(4), unique=True, nullable=False)  # 4文字（例：FT01）
    password = db.Column(db.String(10), nullable=False)  # 10文字まで

    def __init__(self, name, employment_type, employee_id, password):
        self.name = name
        self.employment_type = employment_type
        self.employee_id = employee_id
        self.password = password

class AttendanceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(20), nullable=False)  # '出勤', '退勤', '外出', '戻り'
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    day_of_week = db.Column(db.String(3), nullable=False)  # 曜日を追加（例：'月', '火'など）

    def __repr__(self):
        return f'<AttendanceRecord {self.action_type} {self.date} {self.time}>' 


class MissPunchReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    report_date = db.Column(db.Date, nullable=False)
    report_time = db.Column(db.Time, nullable=False)
    action_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', backref=db.backref('miss_punch_reports', lazy=True))

    def __repr__(self):
        return f'<MissPunchReport {self.action_type} {self.report_date} {self.report_time}>'