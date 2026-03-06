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
const pixContent = document.getElementById('pixContent');
const closePixContentBtn = document.getElementById('close-pix-content');
const submitRechargeBtn = document.getElementById('submit-recharge');
const pixAmount = document.getElementById('pix-amount');
const pixCode = document.getElementById('pix-code');
const copyPixBtn = document.getElementById('copy-pix-btn');
const confirmPaymentBtn = document.getElementById('confirm-payment');
const modalHeader = document.getElementById('modal-header')

// Variável para controle do monitoramento
let paymentMonitoringInterval = null;

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
    // Parar monitoramento ao fechar o modal
    stopPaymentMonitoring();

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

// ===== FUNÇÕES DE MONITORAMENTO DO PIX =====

// Função para verificar status do PIX
async function checkPixStatus(transactionId) {
    try {
        const response = await fetch(`https://api-recarga.vercel.app/${transactionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao verificar status');
        }

        const data = await response.json();
        return data.status; // 'paid' ou 'waiting_payment'
    } catch (error) {
        console.error('Erro na verificação:', error);
        return null;
    }
}

// Função para iniciar monitoramento a cada 5 segundos
function startPaymentMonitoring(transactionId) {
    // Limpar intervalo anterior se existir
    stopPaymentMonitoring();

    console.log('🔄 Monitoramento iniciado - verificando a cada 5 segundos');

    // Verificar imediatamente na primeira vez
    checkPixStatus(transactionId).then(status => {
        handlePaymentStatus(status, transactionId);
    });

    // Configurar verificação a cada 5 segundos
    paymentMonitoringInterval = setInterval(async () => {
        console.log('⏱️ Verificando status do PIX...');
        const status = await checkPixStatus(transactionId);
        handlePaymentStatus(status, transactionId);
    }, 5000); // 5000ms = 5 segundos
}

// Função para tratar o status do pagamento
function handlePaymentStatus(status, transactionId) {
    if (status === 'paid') {
        // PIX foi pago!
        stopPaymentMonitoring();

        // Buscar dados da transação
        const transactionData = JSON.parse(localStorage.getItem('lastTransaction') || '{}');
        const pixData = JSON.parse(localStorage.getItem('pixData') || '{}');

        // Mostrar toast de sucesso
        Toastify({
            text: "✅ PIX PAGO! Sua recarga foi confirmada!",
            duration: 5000,
            gravity: "top",
            position: "center",
            style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500"
            }
        }).showToast();
        window.dataLayer = window.dataLayer || [];
        dataLayer.push({
            event: "purchase",
            transaction_id: String(pixData.id),
            value: parseFloat(transactionData.amount),
            currency: "BRL"
        });

        // Atualizar UI para mostrar que foi pago
        updatePaymentUIPaid();

        // Fechar modal após 3 segundos
        setTimeout(() => {
            closeRechargeModal();
        }, 3000);

    } else if (status === 'waiting_payment') {
        console.log('⌛ Aguardando pagamento...');
    }
}

// Função para parar monitoramento
function stopPaymentMonitoring() {
    if (paymentMonitoringInterval) {
        clearInterval(paymentMonitoringInterval);
        paymentMonitoringInterval = null;
        console.log('🛑 Monitoramento parado');
    }
}

// Função para atualizar UI quando PIX for pago
function updatePaymentUIPaid() {
    // Adicionar indicador visual de pago
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'payment-paid-indicator';
    statusIndicator.className = 'bg-green-500 text-white text-center py-3 rounded-lg font-semibold mb-4';
    statusIndicator.innerHTML = '<i class="fas fa-check-circle mr-2"></i> PAGO - Recarga confirmada!';

    // Inserir no topo do pixContent
    const pixContent = document.getElementById('pixContent');
    if (pixContent && !document.getElementById('payment-paid-indicator')) {
        pixContent.insertBefore(statusIndicator, pixContent.firstChild);
    }

    // Desabilitar botões
    const confirmBtn = document.getElementById('confirm-payment');
    const copyBtn = document.getElementById('copy-pix-btn');
    const closeBtn = document.getElementById('close-pix-content');

    if (confirmBtn) confirmBtn.disabled = true;
    if (copyBtn) copyBtn.disabled = true;
    if (closeBtn) closeBtn.disabled = true;
}

// ===== FUNÇÕES DO PIX =====

function showPixContent(amount, pixData) {
    // Esconder loading e formulário
    loadingModal.classList.add('hidden');
    modalFormBody.classList.add('hidden');

    // Mostrar conteúdo PIX
    pixContent.classList.remove('hidden');

    localStorage.setItem('pixData', JSON.stringify(pixData))
    localStorage.setItem('lastTransaction', JSON.stringify({
        ...JSON.parse(localStorage.getItem('lastTransaction') || '{}'),
        transactionId: pixData.id
    }));

    // Atualizar informações
    pixAmount.textContent = `R$ ${parseFloat(amount).toFixed(2).replace('.', ',')}`;

    if (pixData) {
        // Atualizar QR Code
        const qrcodeContainer = document.getElementById('qrcode-container');
        if (qrcodeContainer && pixData.pix.qrCode) {
            const pixString = pixData.pix.qrCode.trim();
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

        // INICIAR MONITORAMENTO DO PAGAMENTO A CADA 5 SEGUNDOS
        if (pixData.id) {
            startPaymentMonitoring(pixData.transactionId);
        }
    }
}

function closePixContent() {
    stopPaymentMonitoring(); // Parar monitoramento ao fechar
    pixContent.classList.add('hidden');
    modalFormBody.classList.remove('hidden');
}

// No evento de submit do formulário
if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validação...
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

        // if (!modalEmail.value || !modalEmail.value.includes('@')) {
        //     alert('Por favor, insira um e-mail válido.');
        //     modalEmail.focus();
        //     return;
        // }

        // 1. Esconder formulário e mostrar loading
        modalFormBody.classList.add('hidden');
        loadingModal.classList.remove('hidden');

        const formData = {
            phone: modalPhoneNumber.value,
            amount: rechargeOptionSelect.value,
            operator: modalOperatorSelect.value,
            plan: rechargeOptionSelect.options[rechargeOptionSelect.selectedIndex].text
        };

        try {
            // 2. Chamar API
            const pixResponse = await generatePix(
                formData.amount, formData.phone
            );


            console.log("LINE 335--PIX REPONSE >>> ", pixResponse.data)
            

            if (pixResponse.data.success) {
                // 3. Esconder loading e mostrar conteúdo PIX
                showPixContent(formData.amount, pixResponse.data);

                // Salvar transação
                localStorage.setItem('lastTransaction', JSON.stringify({
                    ...formData,
                    transactionId: pixResponse.data.transaction.id,
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
    confirmPaymentBtn.addEventListener('click', async function () {
        const transactionData = JSON.parse(localStorage.getItem('lastTransaction') || '{}');
        const pixData = JSON.parse(localStorage.getItem('pixData') || '{}');

        const transactionId = pixData.transactionId || transactionData.transactionId;

        if (!transactionId) {
            Toastify({
                text: "❌ ID da transação não encontrado",
                duration: 3000,
                gravity: "top",
                position: "center",
                style: { background: "#ef4444" }
            }).showToast();
            return;
        }

        // Mostrar loading
        modalFormBody.classList.add('hidden');
        pixContent.classList.add('hidden');
        loadingModal.classList.remove('hidden');

        // Verificar status manualmente
        const status = await checkPixStatus(transactionId);

        setTimeout(() => {
            loadingModal.classList.add('hidden');

            if (status === 'paid') {
                // Pagamento confirmado
                stopPaymentMonitoring();
                closeRechargeModal();

                Toastify({
                    text: `✅ Pagamento confirmado! Sua recarga de R$ ${transactionData.amount} foi processada.`,
                    duration: 5000,
                    gravity: "top",
                    position: "center",
                    style: {
                        background: "linear-gradient(to right, #00b09b, #96c93d)",
                        borderRadius: "8px"
                    }
                }).showToast();

            } else if (status === 'pending') {
                // Ainda não pago
                pixContent.classList.remove('hidden');

                Toastify({
                    text: "⏳ Pagamento ainda não identificado. Escaneie o QR Code e realize o pagamento.",
                    duration: 4000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#f59e0b" }
                }).showToast();

            } else {
                // Erro
                pixContent.classList.remove('hidden');

                Toastify({
                    text: "❌ Erro ao verificar pagamento. Tente novamente.",
                    duration: 3000,
                    gravity: "top",
                    position: "center",
                    style: { background: "#ef4444" }
                }).showToast();
            }
        }, 1500);
    });
}

// Simulação de API
async function generatePix(amount, phone) {
    const url = "https://api-recarga.vercel.app/create-transaction"
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({ amount, phone })
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
        closePixContentBtn.addEventListener('click', closePixContent);
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
                    document.execCommand('copy');
                    showCopyFeedback(this);
                }
            };

            copyToClipboard();
        });
    }
});


// Função auxiliar para feedback de cópia
function showCopyFeedback(button) {
    const originalHTML = button.innerHTML;
    const originalClass = button.className;

    button.innerHTML = '<i class="fas fa-check mr-2"></i> Copiado!';
    button.className = originalClass.replace('bg-green-500', 'bg-green-600');

    Toastify({
        text: "Código PIX copiado!",
        duration: 2000,
        gravity: "bottom",
        position: "center",
        style: { background: "#10b981" }
    }).showToast();

    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = originalClass;
    }, 2000);
}
