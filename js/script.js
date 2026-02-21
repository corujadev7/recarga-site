// Elementos do modal principal
const rechargeModal = document.getElementById('recharge-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const btnExit = document.getElementById('btn-exit');
const modalPhoneNumber = document.getElementById('modal-phone-number');
const rechargeOptionSelect = document.getElementById('rechargeOption');
const modalOperatorSelect = document.getElementById('modal-operator');
const modalEmail = document.getElementById('modal-email');
const paymentForm = document.getElementById('paymentForm');
const phoneNumber = document.getElementById('phone-number')

// Elementos dos sub-modais
const modalFormBody = document.getElementById('modal-form-body');
const loadingModal = document.getElementById('loadingModal');
// const pixContent = document.getElementById('pixContent');
const pixContent = document.getElementById('pixContent'); // Mudamos de pixContent para pixContent
const closePixContentBtn = document.getElementById('close-pix-content');
const submitRechargeBtn = document.getElementById('submit-recharge');
const pixAmount = document.getElementById('pix-amount');
const pixCode = document.getElementById('pix-code');
const copyPixBtn = document.getElementById('copy-pix-btn');
const confirmPaymentBtn = document.getElementById('confirm-payment');
// const closepixContentBtn = document.getElementById('close-pix-modal');
const modalHeader = document.getElementById('modal-header')

// Funções auxiliares
function formatPhoneNumber(value) {
    let numbers = value.replace(/\D/g, '');

    if (numbers.length > 10) {
        return numbers.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (numbers.length > 6) {
        return numbers.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (numbers.length > 2) {
        return numbers.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    } else if (numbers.length > 0) {
        return numbers.replace(/^(\d*)/, '($1');
    }
    return numbers;
}

// Funções do modal principal
function openRechargeModal(planValue) {
    // Resetar estados dos sub-modais
    loadingModal.classList.add('hidden');
    pixContent.classList.add('hidden');
    modalFormBody.classList.remove('inactive');

    // Resetar botão de submit
    if (submitRechargeBtn) {
        submitRechargeBtn.innerHTML = 'Gerar PIX';
        submitRechargeBtn.disabled = false;
    }

    // Preencher dados
    rechargeOptionSelect.value = planValue;

    // Preencher com dados do formulário principal, se disponíveis
    const mainPhoneNumber = document.getElementById('phone-number')?.value;
    const mainCarrier = document.getElementById('carrier-select')?.value;

    if (mainPhoneNumber && mainPhoneNumber.length >= 14) {
        modalPhoneNumber.value = mainPhoneNumber;
    }

    if (mainCarrier) {
        modalOperatorSelect.value = mainCarrier;
    }

    // Mostrar modal
    rechargeModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Focar no primeiro campo vazio
    if (!modalPhoneNumber.value) {
        modalPhoneNumber.focus();
    } else if (!modalOperatorSelect.value) {
        modalOperatorSelect.focus();
    } else if (modalEmail) {
        modalEmail.focus();
    }
}

function closeRechargeModal() {
    rechargeModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    paymentForm.reset();
}

// Funções do loading
function showLoading() {
    modalFormBody.classList.add('inactive');
    loadingModal.classList.remove('hidden');

    if (submitRechargeBtn) {
        submitRechargeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processando...';
        submitRechargeBtn.disabled = true;
    }
}

function hideLoading() {
    loadingModal.classList.add('hidden');
    modalFormBody.classList.remove('inactive');

    if (submitRechargeBtn) {
        submitRechargeBtn.innerHTML = 'Gerar PIX';
        submitRechargeBtn.disabled = false;
    }
}

// Funções do modal PIX
// function showpixContent(amount, pixData) {
//         // Esconder o loading
//     loadingModal.classList.add('hidden');

//     // Esconder o formulário (já deve estar escondido pelo loading, mas garantimos)
//     modalFormBody.classList.add('hidden');
//     modalHeader.classList.add('hidden');

//     // Mostrar o PIX no mesmo modal
//     pixContent.classList.remove('hidden');
//     localStorage.setItem('pixData', JSON.stringify(pixData))

//     // Atualizar informações
//     pixAmount.textContent = `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}`;

//     if (pixData) {
//         // Atualizar QR Code placeholder
//         const qrcodeContainer = document.getElementById('qrcode-container');
//         if (qrcodeContainer && pixData.qrcode) {
//             // Remove espaços em branco extras e quebras de linha
//             const pixString = pixData.qrcode.trim();

//             qrcodeContainer.innerHTML = `
//             <img
//                 src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixString)}"
//                 alt="QR Code PIX"
//                 class="w-66 h-66"
//                 onerror="this.onerror=null; console.error('Erro ao carregar QR Code')">
//         `;
//         }

//         // Atualizar código PIX
//         if (pixData.qrcode && pixCode) {
//             pixCode.value = pixData.qrcode.trim();
//         }
//     }
// }
// Funções do modal PIX (agora conteúdo, não modal)
function showPixContent(amount, pixData) {
    // Esconder loading e formulário
    loadingModal.classList.add('hidden');
    modalFormBody.classList.add('hidden');

    // Mostrar conteúdo PIX
    pixContent.classList.remove('hidden');

    localStorage.setItem('pixData', JSON.stringify(pixData))

    // Atualizar informações
    pixAmount.textContent = `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}`;

    if (pixData) {
        // Atualizar QR Code
        const qrcodeContainer = document.getElementById('qrcode-container');
        if (qrcodeContainer && pixData.qrcode) {
            const pixString = pixData.qrcode.trim();
            qrcodeContainer.innerHTML = `
            <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixString)}"
                alt="QR Code PIX"
                class="w-48 h-48"
                onerror="this.onerror=null; console.error('Erro ao carregar QR Code')">
        `;
        }

        // Atualizar código PIX
        if (pixData.qrcode && pixCode) {
            pixCode.value = pixData.qrcode.trim();
        }
    }
}

function closePixContent() {
    pixContent.classList.add('hidden');
    modalFormBody.classList.remove('hidden'); // Mostrar formulário novamente
}

// No evento de submit do formulário
if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validação...

        // 1. Esconder formulário e mostrar loading
        modalFormBody.classList.add('hidden');
        loadingModal.classList.remove('hidden');

        const formData = {
            phone: modalPhoneNumber.value,
            amount: rechargeOptionSelect.value,
            operator: modalOperatorSelect.value,
            email: modalEmail.value,
            plan: rechargeOptionSelect.options[rechargeOptionSelect.selectedIndex].text
        };

        try {
            // 2. Chamar API
            const pixResponse = await generatePix(
                formData.amount, formData.email, formData.phone
            );

            // console.log("PIX RESPONSE==>>", pixResponse)

            if (pixResponse.success) {
                // 3. Esconder loading e mostrar conteúdo PIX
                showPixContent(formData.amount, pixResponse);

                // Salvar transação
                localStorage.setItem('lastTransaction', JSON.stringify({
                    ...formData,
                    transactionId: pixResponse.transactionId,
                    timestamp: new Date().toISOString()
                }));
            } else {
                throw new Error('Falha ao gerar PIX');
            }
        } catch (error) {
            // Em caso de erro: esconder loading e mostrar formulário
            loadingModal.classList.add('hidden');
            modalFormBody.classList.remove('hidden');

            alert(`Erro ao processar a recarga: ${error.message}\n\nPor favor, tente novamente.`);
            console.error('Erro na geração do PIX:', error);
        }
    });
}

// Botão Voltar do PIX
if (closePixContentBtn) {
    closePixContentBtn.addEventListener('click', closePixContent);
}

// Botão "Já Paguei"
if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', function () {
        const transactionData = JSON.parse(localStorage.getItem('lastTransaction') || '{}');

        // Mostrar loading
        modalFormBody.classList.add('hidden');
        pixContent.classList.add('hidden');
        loadingModal.classList.remove('hidden');

        setTimeout(() => {
            // Esconder loading e fechar tudo
            loadingModal.classList.add('hidden');
            rechargeModal.classList.add('hidden');
            document.body.style.overflow = 'auto';

            // Reset para próxima vez
            modalFormBody.classList.remove('hidden');
            paymentForm.reset();

            
        }, 2000);
    });
}

function closepixContent() {
    pixContent.classList.add('hidden');
    modalFormBody.classList.remove('inactive');
}

// Simulação de API
async function generatePix(amount, email, phone) {
    const url = "https://api-recarga.vercel.app/create-transaction"
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },

        body: JSON.stringify({ amount, email, phone })
    })


    const result = await response.json();

    return result;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Formatação do telefone no modal
    if (modalPhoneNumber) {
        modalPhoneNumber.addEventListener('input', function (e) {
            this.value = formatPhoneNumber(this.value);
        });
    }

    if (phoneNumber) {
        phoneNumber.addEventListener('input', function (e) {
            this.value = formatPhoneNumber(this.value)
        })
    }

    // Fechar modais
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeRechargeModal);
    }

    if (btnExit) {
        btnExit.addEventListener('click', closeRechargeModal);
    }

    if (closePixContentBtn) {
        closePixContentBtn.addEventListener('click', closepixContent);
    }

    // Fechar modal ao clicar fora
    if (rechargeModal) {
        rechargeModal.addEventListener('click', function (e) {
            if (e.target.id === 'recharge-modal') {
                closeRechargeModal();
            }
        });
    }

    // Fechar com ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (!rechargeModal.classList.contains('hidden')) {
                closeRechargeModal();
            }
        }
    });

    // Botões de plano
    document.querySelectorAll('.plan-btn').forEach(button => {
        button.addEventListener('click', function () {
            const planValue = this.getAttribute('data-value');
            openRechargeModal(planValue);
        });
    });

    // Botões de valor rápido
    document.querySelectorAll('.amount-btn').forEach(button => {
        button.addEventListener('click', function () {
            const phoneNumber = document.getElementById('phone-number')?.value?.trim();
            const carrierSelect = document.getElementById('carrier-select');
            const selectedCarrier = carrierSelect?.value;

            if (!phoneNumber || phoneNumber.length < 14) {
                alert('Por favor, insira um número de telefone válido primeiro.');
                document.getElementById('phone-number')?.focus();
                return;
            }

            if (!selectedCarrier) {
                alert('Por favor, selecione uma operadora primeiro.');
                carrierSelect?.focus();
                return;
            }

            const planValue = this.getAttribute('data-value');
            openRechargeModal(planValue);
        });
    });

    // Botão principal de recarga
    const mainRechargeBtn = document.getElementById('recharge-btn');
    if (mainRechargeBtn) {
        mainRechargeBtn.addEventListener('click', function () {
            const phoneNumber = document.getElementById('modal-phone-number')?.value?.trim();
            const carrierSelect = document.getElementById('carrier-select');
            const selectedCarrier = carrierSelect?.value;
            const customAmountInput = document.getElementById('custom-amount');

            if (!phoneNumber || phoneNumber.length < 14) {
                alert('Por favor, insira um número de telefone válido.');
                document.getElementById('phone-number')?.focus();
                return;
            }

            if (!selectedCarrier) {
                alert('Por favor, selecione uma operadora.');
                carrierSelect?.focus();
                return;
            }

            let planValue = '';
            if (customAmountInput?.value?.trim()) {
                planValue = customAmountInput.value.trim();
            } else {
                const activeAmountBtn = document.querySelector('.amount-btn.active');
                if (activeAmountBtn) {
                    planValue = activeAmountBtn.getAttribute('data-value');
                }
            }

            if (!planValue || isNaN(planValue) || parseFloat(planValue) <= 0) {
                alert('Por favor, selecione ou insira um valor válido para a recarga.');
                return;
            }

            openRechargeModal(planValue);
        });
    }

    // Formulário de pagamento
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validação
            if (!modalPhoneNumber.value || modalPhoneNumber.value.length < 14) {
                alert('Por favor, insira um número de telefone válido.');
                modalPhoneNumber.focus();
                return;
            }

            if (!rechargeOptionSelect.value) {
                alert('Por favor, selecione um plano de recarga.');
                rechargeOptionSelect.focus();
                return;
            }

            if (!modalOperatorSelect.value) {
                alert('Por favor, selecione uma operadora.');
                modalOperatorSelect.focus();
                return;
            }

            if (!modalEmail.value || !modalEmail.value.includes('@')) {
                alert('Por favor, insira um e-mail válido.');
                modalEmail.focus();
                return;
            }

            // Coletar dados


            const formData = {
                phone: modalPhoneNumber.value,
                amount: rechargeOptionSelect.value,
                operator: modalOperatorSelect.value,
                email: modalEmail.value,
                plan: rechargeOptionSelect.options[rechargeOptionSelect.selectedIndex].text
            };

            // Mostrar loading
            showLoading();

            try {
                // Simular API
                const pixResponse = await generatePix(
                    formData.amount, formData.email, formData.phone
                );

                console.log("PIX RESPONSE==>>", pixResponse)

                if (pixResponse.success) {
                    // Mostrar PIX
                    showPixContent(formData.amount, pixResponse);

                    // Salvar transação
                    localStorage.setItem('lastTransaction', JSON.stringify({
                        ...formData,
                        transactionId: pixResponse.transactionId,
                        timestamp: new Date().toISOString()
                    }));
                } else {
                    throw new Error('Falha ao gerar PIX');
                }
            } catch (error) {
                hideLoading();
                alert(`Erro ao processar a recarga: ${error.message}\n\nPor favor, tente novamente.`);
                console.error('Erro na geração do PIX:', error);
            }
        });
    }

    // Copiar código PIX
    if (copyPixBtn) {
        copyPixBtn.addEventListener('click', function () {
            if (!pixCode) return;

            pixCode.select();
            pixCode.setSelectionRange(0, 99999);

            const copyToClipboard = async () => {
                try {
                    await navigator.clipboard.writeText(pixCode.value);
                    showCopyFeedback(this);
                } catch (err) {
                    // Fallback
                    document.execCommand('copy');
                    showCopyFeedback(this);
                }
            };

            copyToClipboard();
        });
    }

    // Botão "Já Paguei"
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', function () {
            const transactionData = JSON.parse(localStorage.getItem('lastTransaction') || '{}');

            // Simular verificação
            // showLoading();

            setTimeout(() => {
                closepixContent();
                hideLoading();
                closeRechargeModal();

                // Feedback
                Toastify({
                    text: `✅ Pagamento confirmado! Sua recarga de R$ ${transactionData.amount} para ${transactionData.phone} foi processada.`,
                    duration: 5000,
                    close: true,
                    gravity: "top", // top or bottom
                    position: "right", // left, center or right
                    stopOnFocus: true,
                    style: {
                        background: "linear-gradient(to right, #00b09b, #96c93d)",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    },
                    onClick: function () { } // Callback after click
                }).showToast();

                // Sincronizar com formulário principal
                const mainPhoneInput = document.getElementById('phone-number');
                const mainCarrierSelect = document.getElementById('carrier-select');
                const customAmountInput = document.getElementById('custom-amount');

                if (mainPhoneInput && transactionData.phone) {
                    mainPhoneInput.value = transactionData.phone;
                }

                if (mainCarrierSelect && transactionData.operator) {
                    mainCarrierSelect.value = transactionData.operator;
                }

                if (customAmountInput && transactionData.amount) {
                    customAmountInput.value = transactionData.amount;
                }
            }, 2000);
        });
    }
});

// Função auxiliar para feedback de cópia
function showCopyFeedback(button) {
    const originalHTML = button.innerHTML;
    const originalClass = button.className;

    button.innerHTML = '<i class="fas fa-check mr-2"></i> Copiado!';
    button.className = originalClass.replace('bg-blue-500', 'bg-green-500');

    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = originalClass;
    }, 2000);
}