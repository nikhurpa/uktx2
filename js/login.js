$(document).ready(function() {
    // Check if user is already logged in
    if (localStorage.getItem('user_logged_in') === 'true') {
        window.location.href = 'dashboard.html';
    }

    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        if (!username || !password) {
            showAlert('Please enter both username and password', 'danger');
            return;
        }
        
        // Show loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<i class="fas fa-spinner fa-spin me-2"></i>Logging in...');
        submitBtn.prop('disabled', true);
        
        // AJAX login request
        $.ajax({
            url: 'php/login.php',
            type: 'POST',
            data: {
                username: username,
                password: password
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    localStorage.setItem('user_logged_in', 'true');
                    localStorage.setItem('user_id', response.user_id);
                    localStorage.setItem('username', response.username);
                    localStorage.setItem('user_role', response.role);
                    localStorage.setItem('user_oa', response.oa);
                    localStorage.setItem('photo_path', response.photo_path);
                    
                    showAlert('Login successful! Redirecting...', 'success');
                    setTimeout(function() {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showAlert(response.message || 'Login failed. Please check your credentials.', 'danger');
                }
            },
            error: function(xhr, status, error) {
                showAlert('Connection error. Please try again.', 'danger');
                console.error('Login error:', error);
            },
            complete: function() {
                // Reset button state
                submitBtn.html(originalText);
                submitBtn.prop('disabled', false);
            }
        });
    });
    
    function showAlert(message, type) {
        const alertDiv = $('#loginAlert');
        alertDiv.removeClass('alert-danger alert-success').addClass('alert-' + type);
        alertDiv.text(message).show();
        
        // Auto-hide after 5 seconds
        setTimeout(function() {
            alertDiv.fadeOut();
        }, 5000);
    }
}); 