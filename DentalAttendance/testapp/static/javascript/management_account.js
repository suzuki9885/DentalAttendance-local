var passwordChangeModalInstance = null; // モーダルインスタンスを保持する変数

function showDeleteConfirmation(userId, userName, employmentType, employeeId) {
    // モーダルに情報を設定
    document.getElementById('deleteConfirmName').textContent = userName;
    document.getElementById('deleteConfirmEmploymentType').textContent = employmentType;
    document.getElementById('deleteConfirmEmployeeId').textContent = employeeId;

    // 削除フォームのactionを設定
    document.getElementById('deleteForm').action = `/delete_account/${userId}`;

    // モーダルを表示
    var modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    modal.show();
}

// 関数名を変更し、モーダル表示ロジックを修正
function openPasswordChangeModal(userId, userName) {
    document.getElementById('changePasswordUserId').value = userId;
    document.getElementById('changePasswordUserName').textContent = userName;
    document.getElementById('newPassword').value = ''; // クリア
    document.getElementById('confirmPassword').value = ''; // クリア
    document.getElementById('passwordError').style.display = 'none'; // エラーメッセージを隠す
    document.getElementById('passwordChangeForm').action = `/update_password/${userId}`; // actionを先に設定

    if (passwordChangeModalInstance) {
        passwordChangeModalInstance.show();
    }
    
    // モーダルが表示された後、最初のパスワードフィールドにフォーカスする
    // イベントリスナーは一度だけ登録すれば良いので、インスタンス作成時に移動
}

// パスワード変更フォームの送信イベントリスナー
document.addEventListener('DOMContentLoaded', function() {
    // モーダルインスタンスをここで一度だけ作成
    const passwordChangeModalElement = document.getElementById('passwordChangeModal');
    if (passwordChangeModalElement) {
        passwordChangeModalInstance = new bootstrap.Modal(passwordChangeModalElement);

        // モーダルが表示された後、最初のパスワードフィールドにフォーカスするイベントリスナーを登録
        passwordChangeModalElement.addEventListener('shown.bs.modal', function () {
            document.getElementById('newPassword').focus();
        });
    }

    const passwordChangeForm = document.getElementById('passwordChangeForm');
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', function(event) {
            const newPasswordInput = document.getElementById('newPassword');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const passwordError = document.getElementById('passwordError');

            if (newPasswordInput.value !== confirmPasswordInput.value) {
                event.preventDefault(); // 送信を中止
                passwordError.textContent = '新しいパスワードと確認用パスワードが一致しません。';
                passwordError.style.display = 'block';
                return;
            }
            passwordError.style.display = 'none';
        });
    }

    // パスワード可視性切り替え機能
    const toggleNewPassword = document.getElementById('toggleNewPassword');
    const newPasswordInput = document.getElementById('newPassword');
    if (toggleNewPassword && newPasswordInput) {
        toggleNewPassword.addEventListener('click', function() {
            const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            newPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
});