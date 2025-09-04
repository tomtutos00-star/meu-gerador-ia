document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt');
    const generateBtn = document.getElementById('generateBtn');
    const spinner = document.querySelector('.spinner');
    const btnText = document.querySelector('.btn-text');
    const resultPlaceholder = document.getElementById('resultPlaceholder');
    const loadingContainer = document.getElementById('loadingContainer');
    const imageContainer = document.getElementById('imageContainer');
    const generatedImage = document.getElementById('generatedImage');
    const mobileModal = document.getElementById('mobileModal');
    const modalImage = document.getElementById('modalImage');
    const uploadArea = document.getElementById('uploadArea');
    const imagePreview = document.getElementById('imagePreview');
    const createFunctions = document.getElementById('createFunctions');
    const editFunctions = document.getElementById('editFunctions');
    const twoImagesSection = document.getElementById('twoImagesSection');
    const imagePreview1 = document.getElementById('imagePreview1');
    const imagePreview2 = document.getElementById('imagePreview2');
    let currentMode = 'create';
    let currentFunction = 'free';
    let currentImageUrl = '';
    let uploadedImageBase64 = null;
    let uploadedImage1Base64 = null;
    let uploadedImage2Base64 = null;

    // Use o modelo Stable Diffusion XL, que é um bom padrão
    const MODEL_ID = 'stabilityai/stable-diffusion-xl'; 

    // Helper para exibir mensagens
    const showMessage = (message, isError = false) => {
        alert(message);
    };

    // Altera entre os modos 'criar' e 'editar'
    document.querySelectorAll('.mode-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelector('.mode-btn.active').classList.remove('active');
            button.classList.add('active');
            currentMode = button.dataset.mode;
            updateUIForMode(currentMode);
        });
    });

    // Altera entre as funções de 'criar' e 'editar'
    document.querySelectorAll('.function-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const parent = card.closest('.functions-section');
            if (parent) {
                parent.querySelector('.function-card.active').classList.remove('active');
            }
            card.classList.add('active');
            currentFunction = card.dataset.function;
            updateUIForFunction(currentFunction);
        });
    });

    // Funções para manipular a UI
    const updateUIForMode = (mode) => {
        if (mode === 'create') {
            createFunctions.style.display = 'block';
            editFunctions.style.display = 'none';
            twoImagesSection.style.display = 'none';
            uploadArea.style.display = 'none';
            promptInput.style.display = 'block';
            generatedImage.src = '';
            imagePreview.style.display = 'none';
            imagePreview.src = '';
            uploadedImageBase64 = null;
        } else {
            createFunctions.style.display = 'none';
            editFunctions.style.display = 'block';
            twoImagesSection.style.display = 'none';
            uploadArea.style.display = 'flex';
            promptInput.style.display = 'none';
            generatedImage.src = '';
        }
    };

    const updateUIForFunction = (func) => {
        if (func === 'compose') {
            editFunctions.style.display = 'none';
            twoImagesSection.style.display = 'flex';
            uploadArea.style.display = 'none';
            promptInput.style.display = 'block';
        } else if (currentMode === 'edit') {
            editFunctions.style.display = 'block';
            twoImagesSection.style.display = 'none';
            uploadArea.style.display = 'flex';
            promptInput.style.display = 'block';
        }
    };

    window.backToEditFunctions = () => {
        twoImagesSection.style.display = 'none';
        editFunctions.style.display = 'block';
        promptInput.style.display = 'none';
        uploadArea.style.display = 'flex';
    };

    // Manipulador de upload de imagem
    window.handleImageUpload = (input, previewId, index) => {
        const file = input.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showMessage("O arquivo é muito grande! O tamanho máximo é 10MB.", true);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewId === 'imagePreview') {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadArea.querySelector('div').style.display = 'none';
                uploadArea.querySelector('.upload-text').style.display = 'none';
                uploadedImageBase64 = e.target.result.split(',')[1];
            } else if (previewId === 'imagePreview1') {
                imagePreview1.src = e.target.result;
                imagePreview1.style.display = 'block';
                uploadedImage1Base64 = e.target.result.split(',')[1];
            } else if (previewId === 'imagePreview2') {
                imagePreview2.src = e.target.result;
                imagePreview2.style.display = 'block';
                uploadedImage2Base64 = e.target.result.split(',')[1];
            }
        };
        reader.readAsDataURL(file);
    };

    // Gerar a imagem
    window.generateImage = async () => {
        let payload = {};
        let model = MODEL_ID;

        // Desabilita o botão e mostra o spinner
        generateBtn.disabled = true;
        spinner.style.display = 'block';
        btnText.style.display = 'none';
        resultPlaceholder.style.display = 'none';
        imageContainer.style.display = 'none';
        loadingContainer.style.display = 'flex';

        try {
            if (currentMode === 'create') {
                if (!promptInput.value) {
                    showMessage("Por favor, descreva a imagem que você deseja criar.");
                    return;
                }
                payload = { prompt: promptInput.value };
                // O modelo base já é um gerador de imagens, então não precisa de um if específico para 'free'.
                // Outras funções como 'sticker', 'text', etc., podem adicionar prompts específicos.
                if (currentFunction === 'sticker') {
                    payload.prompt += " in a sticker style";
                } else if (currentFunction === 'text') {
                    payload.prompt += " as a logo design";
                } else if (currentFunction === 'comic') {
                    payload.prompt += " in a comic book art style";
                }

            } else { // Modo de edição
                if (currentFunction === 'compose') {
                    if (!uploadedImage1Base64 || !uploadedImage2Base64) {
                        showMessage("Por favor, carregue ambas as imagens para usar a função 'Unir'.");
                        return;
                    }
                    payload = {
                        image_1: uploadedImage1Base64,
                        image_2: uploadedImage2Base64,
                        prompt: promptInput.value
                    };
                    // Use um modelo especializado para 'compose' se houver, ou adicione instruções ao prompt
                    // Exemplo: model = 'outro/modelo-de-fusao';
                    payload.prompt += " combining the two uploaded images";

                } else {
                    if (!uploadedImageBase64) {
                        showMessage("Por favor, carregue uma imagem para editar.");
                        return;
                    }
                    payload = {
                        image: uploadedImageBase64,
                        prompt: promptInput.value
                    };
                    // Adicione instruções ao prompt baseadas na função de edição
                    if (currentFunction === 'add-remove') {
                        payload.prompt = `Add or remove elements: ${payload.prompt}`;
                    } else if (currentFunction === 'retouch') {
                        payload.prompt = `Retouch and enhance this image: ${payload.prompt}`;
                    } else if (currentFunction === 'style') {
                        payload.prompt = `Change the style of this image: ${payload.prompt}`;
                    }
                }
            }

            const response = await fetch("https://openrouter.ai/api/v1/generation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.href,
                    "X-Title": "AI Image Studio"
                },
                body: JSON.stringify({
                    model: model,
                    prompt: payload.prompt,
                    data: {
                        image: payload.image,
                        image_1: payload.image_1,
                        image_2: payload.image_2
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro na API: ${errorData.error.message}`);
            }

            const data = await response.json();
            const imageUrl = data.data[0].url;

            // Exibir a imagem gerada
            generatedImage.src = imageUrl;
            currentImageUrl = imageUrl;
            imageContainer.style.display = 'flex';
            loadingContainer.style.display = 'none';

        } catch (error) {
            console.error('Erro ao gerar imagem:', error);
            showMessage(`Erro ao gerar imagem: ${error.message}`, true);
        } finally {
            generateBtn.disabled = false;
            spinner.style.display = 'none';
            btnText.style.display = 'block';
        }
    };

    // Download da imagem
    window.downloadImage = () => {
        if (!currentImageUrl) return;
        const a = document.createElement('a');
        a.href = currentImageUrl;
        a.download = 'minha-imagem-ia.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Edição da imagem gerada
    window.editCurrentImage = () => {
        if (!currentImageUrl) return;
        updateUIForMode('edit');
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const base64Image = canvas.toDataURL('image/png').split(',')[1];
            uploadedImageBase64 = base64Image;

            imagePreview.src = currentImageUrl;
            imagePreview.style.display = 'block';
            uploadArea.querySelector('div').style.display = 'none';
            uploadArea.querySelector('.upload-text').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        img.src = currentImageUrl;
    };

    // Modal para mobile
    if (window.innerWidth <= 768) {
        document.querySelector('.image-actions').style.display = 'none';
        generatedImage.addEventListener('click', () => {
            if (currentImageUrl) {
                modalImage.src = currentImageUrl;
                mobileModal.style.display = 'flex';
            }
        });
    }

    window.editFromModal = () => {
        mobileModal.style.display = 'none';
        editCurrentImage();
    };

    window.downloadFromModal = () => {
        mobileModal.style.display = 'none';
        downloadImage();
    };

    window.newImageFromModal = () => {
        mobileModal.style.display = 'none';
        window.location.reload();
    };

    // Manipuladores de arrastar e soltar
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            document.getElementById('imageUpload').files = dataTransfer.files;
            document.getElementById('imageUpload').dispatchEvent(new Event('change'));
        }
    });
});