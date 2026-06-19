/* =====================================================================
   DOCE ENCANTO — SCRIPT PRINCIPAL
   Responsável por:
   - Gerenciar o carrinho de compras (adicionar, aumentar, diminuir, remover)
   - Atualizar o contador e o total na tela em tempo real
   - Abrir/fechar o modal do carrinho
   - Montar a mensagem do pedido e enviar para o WhatsApp
   Tudo em JavaScript puro, sem frameworks e sem backend.
   ===================================================================== */

   (function () {
    "use strict";
  
    /* ---------------- 1. NÚMERO DO WHATSAPP DA LOJA ---------------- */
    // Número que recebe os pedidos, já no formato internacional (sem espaços/símbolos)
    const WHATSAPP_NUMBER = "5584960803633";
  
    /* ---------------- 2. ESTADO DO CARRINHO ----------------
       Estrutura de cada item:
       { id: 'brigadeiro', name: 'Brigadeiro', emoji: '🍫', price: 1.50, qty: 2 }
    */
    let cart = [];
  
    // Tenta recuperar um carrinho salvo anteriormente no navegador (persistência simples,
    // não é obrigatório pelo projeto, mas melhora a experiência caso a página recarregue)
    try {
      const saved = localStorage.getItem("doceEncantoCart");
      if (saved) cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
  
    /* ---------------- 3. REFERÊNCIAS DOS ELEMENTOS DO DOM ---------------- */
    const cartButton = document.getElementById("cartButton");
    const cartOverlay = document.getElementById("cartOverlay");
    const cartModal = document.getElementById("cartModal");
    const closeCartBtn = document.getElementById("closeCart");
    const cartItemsContainer = document.getElementById("cartItems");
    const emptyCartMsg = document.getElementById("emptyCartMsg");
    const cartTotalEl = document.getElementById("cartTotal");
    const cartCountEl = document.getElementById("cartCount");
    const checkoutForm = document.getElementById("checkoutForm");
    const toastEl = document.getElementById("toast");
  
    const addButtons = document.querySelectorAll('[data-action="add"]');
  
    /* ---------------- 4. FUNÇÕES UTILITÁRIAS ---------------- */
  
    // Formata um número para o padrão monetário brasileiro (R$ 0,00)
    function formatBRL(value) {
      return "R$ " + value.toFixed(2).replace(".", ",");
    }
  
    // Salva o estado atual do carrinho no localStorage
    function persistCart() {
      try {
        localStorage.setItem("doceEncantoCart", JSON.stringify(cart));
      } catch (e) {
        /* localStorage pode estar indisponível (modo privado, etc.) — ignoramos o erro */
      }
    }
  
    // Calcula o valor total do carrinho somando (preço x quantidade) de cada item
    function getCartTotal() {
      return cart.reduce((total, item) => total + item.price * item.qty, 0);
    }
  
    // Retorna a quantidade total de itens (para o contador do ícone do carrinho)
    function getCartItemCount() {
      return cart.reduce((total, item) => total + item.qty, 0);
    }
  
    // Mostra uma notificação rápida no rodapé da tela
    function showToast(message) {
      toastEl.textContent = message;
      toastEl.classList.add("show");
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => {
        toastEl.classList.remove("show");
      }, 2200);
    }
  
    /* ---------------- 5. RENDERIZAÇÃO DO CARRINHO ---------------- */
  
    // Redesenha toda a lista de itens do carrinho, o total e o contador
    function renderCart() {
      // Atualiza o contador no ícone do carrinho
      const count = getCartItemCount();
      cartCountEl.textContent = count;
      cartCountEl.classList.add("bump");
      setTimeout(() => cartCountEl.classList.remove("bump"), 200);
  
      // Limpa a lista atual antes de redesenhar
      cartItemsContainer.innerHTML = "";
  
      if (cart.length === 0) {
        emptyCartMsg.hidden = false;
      } else {
        emptyCartMsg.hidden = true;
  
        cart.forEach((item) => {
          const subtotal = item.price * item.qty;
  
          // Cria o elemento HTML do item dinamicamente
          const itemEl = document.createElement("div");
          itemEl.className = "cart-item";
          itemEl.innerHTML = `
            <div class="cart-item-info">
              <h4>${item.emoji} ${item.name}</h4>
              <span class="unit-price">${formatBRL(item.price)} cada</span>
              <div class="qty-controls">
                <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade de ${item.name}">−</button>
                <span class="qty-value">${item.qty}</span>
                <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade de ${item.name}">+</button>
              </div>
              <a href="#" class="remove-item" data-action="remove" data-id="${item.id}">Remover</a>
            </div>
            <div class="cart-item-subtotal">${formatBRL(subtotal)}</div>
          `;
          cartItemsContainer.appendChild(itemEl);
        });
      }
  
      // Atualiza o total geral do pedido
      cartTotalEl.textContent = formatBRL(getCartTotal());
  
      // Salva o estado atualizado
      persistCart();
    }
  
    /* ---------------- 6. AÇÕES DO CARRINHO ---------------- */
  
    // Adiciona um produto ao carrinho (ou aumenta a quantidade se já existir)
    function addToCart(id, name, emoji, price) {
      const existing = cart.find((item) => item.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, emoji, price, qty: 1 });
      }
      renderCart();
      showToast(`${emoji} ${name} adicionado ao carrinho!`);
    }
  
    // Aumenta a quantidade de um item já presente no carrinho
    function increaseQty(id) {
      const item = cart.find((i) => i.id === id);
      if (item) {
        item.qty += 1;
        renderCart();
      }
    }
  
    // Diminui a quantidade; remove o item automaticamente se chegar a zero
    function decreaseQty(id) {
      const item = cart.find((i) => i.id === id);
      if (!item) return;
      item.qty -= 1;
      if (item.qty <= 0) {
        cart = cart.filter((i) => i.id !== id);
      }
      renderCart();
    }
  
    // Remove um item completamente do carrinho, independente da quantidade
    function removeItem(id) {
      cart = cart.filter((i) => i.id !== id);
      renderCart();
    }
  
    /* ---------------- 7. ABERTURA E FECHAMENTO DO MODAL ---------------- */
  
    function openCart() {
      cartOverlay.hidden = false;
      cartModal.hidden = false;
      // pequeno delay para garantir que a transição CSS seja aplicada
      requestAnimationFrame(() => {
        cartOverlay.classList.add("show");
        cartModal.classList.add("show");
      });
      document.body.style.overflow = "hidden";
    }
  
    function closeCart() {
      cartOverlay.classList.remove("show");
      cartModal.classList.remove("show");
      document.body.style.overflow = "";
      // espera a animação de saída terminar antes de esconder de fato
      setTimeout(() => {
        cartOverlay.hidden = true;
        cartModal.hidden = true;
      }, 320);
    }
  
    /* ---------------- 8. MONTAGEM DA MENSAGEM E ENVIO PARA O WHATSAPP ---------------- */
  
    function buildWhatsAppMessage(customer) {
      const lines = [];
  
      lines.push("🍫 PEDIDO DE DOCES");
      lines.push(`Cliente: ${customer.name}`);
      lines.push(`Telefone: ${customer.phone}`);
      lines.push(`Endereço: ${customer.address}`);
      lines.push("");
      lines.push("Itens:");
  
      cart.forEach((item) => {
        const subtotal = item.price * item.qty;
        lines.push(`${item.emoji} ${item.name} x ${item.qty} = ${formatBRL(subtotal)}`);
      });
  
      lines.push("");
      lines.push(`Total do Pedido: ${formatBRL(getCartTotal())}`);
  
      if (customer.notes && customer.notes.trim() !== "") {
        lines.push("");
        lines.push("Observações:");
        lines.push(customer.notes.trim());
      }
  
      lines.push("");
      lines.push("Obrigado!");
  
      return lines.join("\n");
    }
  
    function sendOrderToWhatsApp(event) {
      event.preventDefault();
  
      if (cart.length === 0) {
        showToast("Adicione pelo menos um item antes de finalizar 🍬");
        return;
      }
  
      // Captura os dados informados no formulário
      const customer = {
        name: document.getElementById("custName").value.trim(),
        phone: document.getElementById("custPhone").value.trim(),
        address: document.getElementById("custAddress").value.trim(),
        notes: document.getElementById("custNotes").value,
      };
  
      if (!customer.name || !customer.phone || !customer.address) {
        showToast("Preencha nome, telefone e endereço para continuar");
        return;
      }
  
      // Monta a mensagem final e codifica para uso em uma URL
      const message = buildWhatsAppMessage(customer);
      const encodedMessage = encodeURIComponent(message);
  
      // Monta o link wa.me com o número da loja e a mensagem pronta
      const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  
      // Abre o WhatsApp (ou WhatsApp Web) em uma nova aba
      window.open(whatsappURL, "_blank");
    }
  
    /* ---------------- 9. EVENTOS ---------------- */
  
    // Clique nos botões "Adicionar ao carrinho" de cada produto
    addButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseFloat(card.dataset.price);
        const emoji = name === "Brigadeiro" ? "🍫" : "🧁";
        addToCart(id, name, emoji, price);
      });
    });
  
    // Abrir/fechar o modal do carrinho
    cartButton.addEventListener("click", openCart);
    closeCartBtn.addEventListener("click", closeCart);
    cartOverlay.addEventListener("click", closeCart);
  
    // Fecha o modal com a tecla Esc
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !cartModal.hidden) {
        closeCart();
      }
    });
  
    // Delegação de eventos para os botões "+", "-" e "Remover" dentro da lista de itens
    cartItemsContainer.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;
  
      const action = target.dataset.action;
      const id = target.dataset.id;
  
      if (action === "increase") increaseQty(id);
      if (action === "decrease") decreaseQty(id);
      if (action === "remove") {
        e.preventDefault();
        removeItem(id);
      }
    });
  
    // Envio do formulário -> gera mensagem e abre o WhatsApp
    checkoutForm.addEventListener("submit", sendOrderToWhatsApp);
  
    /* ---------------- 10. INICIALIZAÇÃO ---------------- */
    renderCart();
  })();