// Chave para armazenar os dados no localStorage
const STORAGE_KEY = 'footerData';

// Dados padrão do rodapé
const defaultFooterData = {
    companyName: 'Empresa Exemplo Ltda',
    phone: '(00) 0000-0000',
    address: 'Endereço não informado',
    cnpj: '00.000.000/0001-00'
};

// Função para aplicar máscara de CNPJ
function aplicarMascaraCnpj(cnpj) {
    // Remove tudo que não é número
    let valor = cnpj.replace(/\D/g, '');
    
    // Aplica a máscara
    if (valor.length <= 2) {
        return valor;
    } else if (valor.length <= 5) {
        return valor.replace(/^(\d{2})(\d{1,3})/, '$1.$2');
    } else if (valor.length <= 8) {
        return valor.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (valor.length <= 12) {
        return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
    } else {
        return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
    }
}

// Função para limpar máscara do CNPJ (deixar só números)
function limparMascaraCnpj(cnpj) {
    return cnpj.replace(/\D/g, '');
}

// Função para buscar dados do CNPJ na API
async function buscarCnpj(cnpj) {
    // Remove caracteres não numéricos
    cnpj = limparMascaraCnpj(cnpj);
    
    if (cnpj.length !== 14) {
        throw new Error('CNPJ deve conter 14 números');
    }
    
    try {
        // SUBSTITUA AQUI PELA URL DA SUA API
        const apiUrl = `https://api.opencnpj.org/${cnpj}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('CNPJ não encontrado');
        }
        
        const data = await response.json();
        
        // Processar apenas os dados necessários
        return processarDadosCnpj(data);
    } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
        throw new Error('Erro ao buscar informações do CNPJ. Verifique o número e tente novamente.');
    }
}

// Função para processar apenas os dados que você precisa
function processarDadosCnpj(data) {
    // 1. Nome Fantasia ou Razão Social
    let nomeExibicao = data.razao_social;
    if (data.nome_fantasia && data.nome_fantasia.trim() !== '') {
        nomeExibicao = data.nome_fantasia;
    }
    
    // 2. Telefone
    let telefoneFormatado = 'Telefone não informado';
    if (data.telefones && data.telefones.length > 0) {
        const telefone = data.telefones[0];
        telefoneFormatado = formatarTelefone(telefone.ddd, telefone.numero);
    }
    
    // 3. Endereço
    let enderecoCompleto = 'Endereço não informado';
    if (data.logradouro && data.logradouro !== '') {
        enderecoCompleto = data.logradouro;
        if (data.numero && data.numero !== '') {
            enderecoCompleto += `, ${data.numero}`;
        }
        if (data.bairro && data.bairro !== '') {
            enderecoCompleto += ` - ${data.bairro}`;
        }
        if (data.municipio && data.uf) {
            enderecoCompleto += `, ${data.municipio}/${data.uf}`;
        }
    }
    
    // 4. CNPJ formatado
    let cnpjFormatado = formatarCnpj(data.cnpj);
    
    return {
        companyName: nomeExibicao,
        phone: telefoneFormatado,
        address: enderecoCompleto,
        cnpj: cnpjFormatado
    };
}

// Função para formatar CNPJ
function formatarCnpj(cnpj) {
    if (!cnpj) return '00.000.000/0001-00';
    // Remove tudo que não é número
    const numeros = cnpj.replace(/\D/g, '');
    // Aplica a máscara
    return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// Função para formatar telefone
function formatarTelefone(ddd, numero) {
    if (!ddd || !numero) return 'Telefone não informado';
    if (numero.length === 8) {
        return `(${ddd}) ${numero.slice(0,4)}-${numero.slice(4)}`;
    } else if (numero.length === 9) {
        return `(${ddd}) ${numero.slice(0,5)}-${numero.slice(5)}`;
    }
    return `(${ddd}) ${numero}`;
}

// Função para salvar dados do rodapé
function salvarDadosFooter(dados) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    atualizarFooterPublico(dados);
    return dados;
}

// Função para carregar dados do rodapé
function carregarDadosFooter() {
    const dadosSalvos = localStorage.getItem(STORAGE_KEY);
    if (dadosSalvos) {
        return JSON.parse(dadosSalvos);
    }
    return defaultFooterData;
}

// Função para atualizar o rodapé na página pública
function atualizarFooterPublico(dados) {
    const companyNameEl = document.getElementById('companyName');
    const companyPhoneEl = document.getElementById('companyPhone');
    const companyAddressEl = document.getElementById('companyAddress');
    const companyCnpjEl = document.getElementById('companyCnpj');
    
    if (companyNameEl) companyNameEl.textContent = dados.companyName;
    if (companyPhoneEl) companyPhoneEl.textContent = dados.phone;
    if (companyAddressEl) companyAddressEl.textContent = dados.address;
    if (companyCnpjEl) companyCnpjEl.textContent = `CNPJ: ${dados.cnpj}`;
}

// Função para atualizar a exibição das informações atuais na página admin
function atualizarInfoAdmin() {
    const dados = carregarDadosFooter();
    
    const currentName = document.getElementById('currentName');
    const currentPhone = document.getElementById('currentPhone');
    const currentAddress = document.getElementById('currentAddress');
    const currentCnpj = document.getElementById('currentCnpj');
    
    if (currentName) currentName.textContent = dados.companyName;
    if (currentPhone) currentPhone.textContent = dados.phone;
    if (currentAddress) currentAddress.textContent = dados.address;
    if (currentCnpj) currentCnpj.textContent = dados.cnpj;
    
    // Preencher campos manuais com dados atuais
    const manualName = document.getElementById('manualName');
    const manualPhone = document.getElementById('manualPhone');
    const manualAddress = document.getElementById('manualAddress');
    const manualCnpj = document.getElementById('manualCnpj');
    
    if (manualName) manualName.value = dados.companyName;
    if (manualPhone) manualPhone.value = dados.phone;
    if (manualAddress) manualAddress.value = dados.address;
    if (manualCnpj) manualCnpj.value = dados.cnpj;
}

// Função para mostrar mensagem
function mostrarMensagem(tipo, mensagem) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    
    if (tipo === 'error') {
        if (errorDiv) {
            errorDiv.textContent = mensagem;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    } else if (tipo === 'success') {
        if (successDiv) {
            successDiv.textContent = mensagem;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// ==================== INICIALIZAÇÃO ====================

// Verificar se está na página pública (index.html)
if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
    // Carregar dados e atualizar rodapé
    const dados = carregarDadosFooter();
    atualizarFooterPublico(dados);
}

// Verificar se está na página admin
if (window.location.pathname.includes('admin.html')) {
    // Atualizar informações atuais
    atualizarInfoAdmin();
    
    // Elementos do DOM
    const btnSearch = document.getElementById('btnSearchCnpj');
    const cnpjInput = document.getElementById('cnpjInput');
    const searchResult = document.getElementById('searchResult');
    const loading = document.getElementById('loading');
    const btnConfirm = document.getElementById('btnConfirmFooter');
    const btnClear = document.getElementById('btnClear');
    const btnManualUpdate = document.getElementById('btnManualUpdate');
    
    // Aplicar máscara ao campo CNPJ enquanto digita
    if (cnpjInput) {
        cnpjInput.addEventListener('input', function(e) {
            let valor = e.target.value;
            valor = aplicarMascaraCnpj(valor);
            e.target.value = valor;
        });
    }
    
    // Aplicar máscara ao campo manual de CNPJ
    const manualCnpj = document.getElementById('manualCnpj');
    if (manualCnpj) {
        manualCnpj.addEventListener('input', function(e) {
            let valor = e.target.value;
            valor = aplicarMascaraCnpj(valor);
            e.target.value = valor;
        });
    }
    
    // Buscar CNPJ
    if (btnSearch) {
        btnSearch.addEventListener('click', async () => {
            let cnpj = cnpjInput.value.trim();
            
            if (!cnpj) {
                mostrarMensagem('error', 'Por favor, digite um CNPJ');
                return;
            }
            
            // Remove máscara para validação
            const cnpjNumeros = limparMascaraCnpj(cnpj);
            if (cnpjNumeros.length !== 14) {
                mostrarMensagem('error', 'CNPJ inválido. Deve conter 14 números');
                return;
            }
            
            try {
                // Mostrar loading
                if (loading) loading.style.display = 'block';
                if (searchResult) searchResult.style.display = 'none';
                
                // Buscar dados
                const dadosCnpj = await buscarCnpj(cnpjNumeros);
                
                // Preencher resultados
                document.getElementById('resultCompanyName').textContent = dadosCnpj.companyName;
                document.getElementById('resultPhone').textContent = dadosCnpj.phone;
                document.getElementById('resultAddress').textContent = dadosCnpj.address;
                document.getElementById('resultCnpj').textContent = dadosCnpj.cnpj;
                
                // Armazenar dados temporariamente
                window.tempCnpjData = dadosCnpj;
                
                // Mostrar resultado
                if (searchResult) searchResult.style.display = 'block';
                if (loading) loading.style.display = 'none';
                
            } catch (error) {
                if (loading) loading.style.display = 'none';
                mostrarMensagem('error', error.message);
            }
        });
    }
    
    // Confirmar e atualizar rodapé com dados do CNPJ
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            if (!window.tempCnpjData) {
                mostrarMensagem('error', 'Nenhum dado de CNPJ para salvar');
                return;
            }
            
            salvarDadosFooter(window.tempCnpjData);
            atualizarInfoAdmin();
            mostrarMensagem('success', 'Rodapé atualizado com sucesso!');
            
            // Limpar resultado
            if (searchResult) searchResult.style.display = 'none';
            window.tempCnpjData = null;
            cnpjInput.value = '';
        });
    }
    
    // Limpar resultado
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (searchResult) searchResult.style.display = 'none';
            cnpjInput.value = '';
            window.tempCnpjData = null;
        });
    }
    
    // Atualizar manualmente
    if (btnManualUpdate) {
        btnManualUpdate.addEventListener('click', () => {
            const manualName = document.getElementById('manualName').value;
            const manualPhone = document.getElementById('manualPhone').value;
            const manualAddress = document.getElementById('manualAddress').value;
            let manualCnpjValue = document.getElementById('manualCnpj').value;
            
            if (!manualName) {
                mostrarMensagem('error', 'Nome da empresa é obrigatório');
                return;
            }
            
            // Se o CNPJ foi preenchido, garantir que está no formato correto
            if (manualCnpjValue) {
                const cnpjNumeros = limparMascaraCnpj(manualCnpjValue);
                if (cnpjNumeros.length === 14) {
                    manualCnpjValue = formatarCnpj(cnpjNumeros);
                }
            }
            
            const dados = {
                companyName: manualName,
                phone: manualPhone || 'Telefone não informado',
                address: manualAddress || 'Endereço não informado',
                cnpj: manualCnpjValue || '00.000.000/0001-00'
            };
            
            salvarDadosFooter(dados);
            atualizarInfoAdmin();
            mostrarMensagem('success', 'Rodapé atualizado manualmente!');
        });
    }
}