function loadRestorationForm(faultId) {
    $('#page-content').html(`
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Restore Fault - ${faultId}</h5>
            </div>
            <div class="card-body">
                <form id="restorationForm">
                    <input type="hidden" name="fault_id" value="${faultId}">
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="restoration_date" class="form-label">Restoration Date *</label>
                                <input type="date" class="form-control" id="restoration_date" name="restoration_date" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="restoration_time" class="form-label">Restoration Time *</label>
                                <input type="time" class="form-control" id="restoration_time" name="restoration_time" required>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="restoration_brief" class="form-label">Restoration Brief *</label>
                        <textarea class="form-control" id="restoration_brief" name="restoration_brief" rows="4" required placeholder="Describe the restoration work performed..."></textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Restoration Images</label>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="input-group">
                                    <input type="file" class="form-control" id="restoration_images" name="restoration_images[]" accept="image/*" multiple>
                                    <button type="button" class="btn btn-outline-secondary" onclick="captureImage()">
                                        <i class="fas fa-camera me-1"></i>Capture
                                    </button>
                                </div>
                                <small class="text-muted">You can select multiple images or capture new ones</small>
                            </div>
                            <div class="col-md-6">
                                <div id="imagePreview" class="d-flex flex-wrap gap-2">
                                    <!-- Image previews will be shown here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="button" class="btn btn-secondary me-md-2" onclick="loadPage('pending-faults')">Cancel</button>
                        <button type="submit" class="btn btn-success">
                            <i class="fas fa-check me-1"></i>Mark as Restored
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `);
    
    // Set current date and time
    const now = new Date();
    $('#restoration_date').val(now.toISOString().split('T')[0]);
    $('#restoration_time').val(now.toTimeString().slice(0, 5));
    
    // Handle form submission
    $('#restorationForm').on('submit', function(e) {
        e.preventDefault();
        submitRestoration();
    });
    
    // Handle file input change
    $('#restoration_images').on('change', function(e) {
        handleImageSelection(e.target.files);
    });
}

function captureImage() {
    // Check if camera is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera not available on this device');
        return;
    }
    
    // Create camera modal
    const modal = `
        <div class="modal fade" id="cameraModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Capture Image</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <video id="cameraVideo" autoplay style="max-width: 100%; height: 400px; background: #000;"></video>
                        <canvas id="cameraCanvas" style="display: none;"></canvas>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="capturePhoto()">
                            <i class="fas fa-camera me-1"></i>Capture Photo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    $('#cameraModal').remove();
    
    // Add modal to body
    $('body').append(modal);
    
    // Show modal
    const cameraModal = new bootstrap.Modal(document.getElementById('cameraModal'));
    cameraModal.show();
    
    // Start camera
    startCamera();
}

let cameraStream = null;

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            cameraStream = stream;
            const video = document.getElementById('cameraVideo');
            video.srcObject = stream;
        })
        .catch(function(err) {
            alert('Error accessing camera: ' + err.message);
            bootstrap.Modal.getInstance(document.getElementById('cameraModal')).hide();
        });
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(function(blob) {
        // Create file from blob
        const file = new File([blob], 'captured_image_' + Date.now() + '.jpg', { type: 'image/jpeg' });
        
        // Add to file input
        const fileInput = document.getElementById('restoration_images');
        const dt = new DataTransfer();
        
        // Add existing files
        for (let i = 0; i < fileInput.files.length; i++) {
            dt.items.add(fileInput.files[i]);
        }
        
        // Add new captured file
        dt.items.add(file);
        fileInput.files = dt.files;
        
        // Trigger change event
        $(fileInput).trigger('change');
        
        // Close modal and stop camera
        bootstrap.Modal.getInstance(document.getElementById('cameraModal')).hide();
        stopCamera();
    }, 'image/jpeg', 0.8);
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function handleImageSelection(files) {
    const preview = $('#imagePreview');
    preview.empty();
    
    Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = $(`
                    <div class="position-relative" style="width: 100px; height: 100px;">
                        <img src="${e.target.result}" class="img-thumbnail" style="width: 100%; height: 100%; object-fit: cover;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" onclick="removeImage(${index})" style="font-size: 10px;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `);
                preview.append(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

function removeImage(index) {
    const fileInput = document.getElementById('restoration_images');
    const dt = new DataTransfer();
    
    // Add all files except the one to remove
    for (let i = 0; i < fileInput.files.length; i++) {
        if (i !== index) {
            dt.items.add(fileInput.files[i]);
        }
    }
    
    fileInput.files = dt.files;
    $(fileInput).trigger('change');
}

function submitRestoration() {
    const formData = new FormData($('#restorationForm')[0]);
    
    // Show loading state
    const submitBtn = $('#restorationForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<i class="fas fa-spinner fa-spin me-1"></i>Processing...');
    submitBtn.prop('disabled', true);
    
    $.ajax({
        url: 'php/restore_fault.php',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                showAlert('Fault restored successfully!', 'success');
                setTimeout(function() {
                    loadPage('pending-faults');
                }, 1500);
            } else {
                showAlert('Error: ' + response.message, 'danger');
            }
        },
        error: function() {
            showAlert('Error restoring fault. Please try again.', 'danger');
        },
        complete: function() {
            // Reset button state
            submitBtn.html(originalText);
            submitBtn.prop('disabled', false);
        }
    });
}

// function showAlert(message, type) {
//     const alertDiv = $('<div class="alert alert-' + type + ' alert-dismissible fade show" role="alert">' +
//         message +
//         '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' +
//         '</div>');
    
//     $('#page-content').prepend(alertDiv);
    
//     // Auto-hide after 5 seconds
//     setTimeout(function() {
//         alertDiv.alert('close');
//     }, 5000);
// } 