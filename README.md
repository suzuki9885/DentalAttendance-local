# DentalAttendance

## 環境構築

### 仮想環境の構築

```bash
python3.11 -m venv myvenv
source myenv/bin/activate
```

### 必要なパッケージのインストール

```bash
pip install -r requirements.txt
```

データベースの初期化

1. データベースの作成
```bash
cd DentalAttendance
flask db init
flask db migrate
flask db upgrade
```

2. 管理者アカウントの設定
必要であれば、環境変数で管理者ID(your_admin_id)とパスワード(your_admin_password)を設定します：
（初期設定は、管理者ID：id00、パスワード：pass00としている）
```bash
export ADMIN_ID=your_admin_id
export ADMIN_PASSWORD=your_admin_password
```

## アプリケーションの起動

1. アプリケーションの起動
```bash
cd DentalAttendance
python3 server.py
```

2. ブラウザでアクセス
```
http://127.0.0.1:5000
```

## 主な機能
- 従業員ログイン
![従業員のログイン](images/従業員ログイン.png)
- 正社員用の勤怠登録（出勤、退勤）
![正社員用の勤怠登録](images/正社員用の勤怠登録.png)
- パート用の勤怠登録（出勤、退勤、外出、戻り）
![パート用のログイン](images/パート用のログイン.png)
- 管理者ログイン
![管理者ログイン](images/管理者ログイン.png)
- 管理者画面
![管理者画面](images/管理者画面.png)
- アカウント追加
![アカウント追加](images/アカウント追加.png)
- 勤怠履歴（表示とPDFダウンロード）
![勤怠履歴](images/勤怠履歴.png)
月次集計表（表示とExcelダウンロード）
![月次集計表](images/月次集計表.png)
- アカウント管理（追加、削除）
![アカウント管理](images/アカウント管理.png)
