/* =====================================================================
   DOCE ENCANTO — SCRIPT PRINCIPAL
   Responsável por:
   - Manter a lista de produtos (fonte única de dados)
   - Renderizar os cards de produto dinamicamente
   - Gerenciar o carrinho de compras (adicionar, aumentar, diminuir, remover)
   - Atualizar o contador e o total na tela em tempo real
   - Abrir/fechar o modal do carrinho
   - Montar a mensagem do pedido (com endereço de entrega) e enviar para o WhatsApp
   Tudo em JavaScript puro, sem frameworks e sem backend.
   ===================================================================== */

   (function () {
    "use strict";
  
    /* ---------------- 1. NÚMERO DO WHATSAPP DA LOJA ---------------- */
    // Número que recebe os pedidos, já no formato internacional (sem espaços/símbolos)
    const WHATSAPP_NUMBER = "558496551333";
  
    /* ---------------- 2. LISTA DE PRODUTOS (FONTE ÚNICA DE DADOS) ----------------
       Qualquer alteração aqui (adicionar, remover, mudar preço/nome) atualiza
       automaticamente: os cards do cardápio, o carrinho, os cálculos de total
       e a mensagem enviada para o WhatsApp.
    */
    const PRODUCTS = [
      {
        id: "brigadeiro-Único",
        emoji: "🍫",
        name: "Brigadeiro Único",
        price: 2.00,
        desc: "Bolinha cremosa de chocolate, enrolada na granulada e finalizada à mão. O clássico que nunca sai de moda.",
        image: "https://images.pexels.com/photos/33158039/pexels-photo-33158039.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Brigadeiros artesanais cobertos com granulado de chocolate",
      },
      {
        id: "caixa-4-brigadeiros",
        emoji: "📦",
        name: "Caixa com 4 Brigadeiros",
        price: 6.99,
        desc: "Caixinha com 4 brigadeiros artesanais, prontos para presentear ou se presentear.",
        image: "https://images.pexels.com/photos/9285186/pexels-photo-9285186.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Caixa com brigadeiros artesanais de chocolate",
      },
      {
        id: "caixa-6-brigadeiros",
        emoji: "📦",
        name: "Caixa com 6 Brigadeiros",
        price: 9.99,
        desc: "Caixinha com 6 brigadeiros artesanais — a escolha perfeita para compartilhar.",
        image: "https://images.pexels.com/photos/9285199/pexels-photo-9285199.jpeg?auto=compress&cs=tinysrgb&w=800",
        alt: "Caixa com seis brigadeiros artesanais de chocolate",
      },
    ];
  
    /* ---------------- 3. ESTADO DO CARRINHO ----------------
       Estrutura de cada item:
       { id: 'brigadeiro-unitario', name: 'Brigadeiro Unitário', emoji: '🍫', price: 2.00, qty: 2 }
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
  
    // Remove do carrinho salvo qualquer produto que não exista mais na lista atual
    // (ex.: o Cupcake, removido do cardápio), para nunca quebrar o cálculo do total.
    cart = cart.filter((item) => PRODUCTS.some((p) => p.id === item.id));
  
    /* ---------------- 4. REFERÊNCIAS DOS ELEMENTOS DO DOM ---------------- */
    const productGrid = document.getElementById("productGrid");
  
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
  
    const custAddressInput = document.getElementById("custAddress");
  
    /* ---------------- 5. FUNÇÕES UTILITÁRIAS ---------------- */
  
    // Formata um número para o padrão monetário brasileiro (R$ 0,00)
    function formatBRL(value) {
      return "R$ " + value.toFixed(2).replace(".", ",");
    }
  
    // Busca um produto da lista PRODUCTS pelo id
    function findProduct(id) {
      return PRODUCTS.find((p) => p.id === id);
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
  
    /* ---------------- 6. RENDERIZAÇÃO DOS CARDS DE PRODUTO ---------------- */
  
    // Gera o HTML de todos os cards de produto a partir da lista PRODUCTS
    function renderProductGrid() {
      productGrid.innerHTML = PRODUCTS.map((p) => `
        <article class="product-card" data-id="${p.id}">
          <div class="product-photo">
            <img src="${p.image}" alt="${p.alt}" loading="lazy" />
          </div>
          <div class="product-body">
            <div class="product-title-row">
              <h3>${p.emoji} ${p.name}</h3>
              <span class="price">${formatBRL(p.price)}</span>
            </div>
            <p class="product-desc">${p.desc}</p>
            <button class="btn btn-add" type="button" data-action="add" data-id="${p.id}">
              <span>Adicionar ao carrinho</span>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
            </button>
          </div>
        </article>
      `).join("");
    }
  
    /* ---------------- 7. RENDERIZAÇÃO DO CARRINHO ---------------- */
  
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
  
    /* ---------------- 8. AÇÕES DO CARRINHO ---------------- */
  
    // Adiciona um produto ao carrinho (ou aumenta a quantidade se já existir)
    function addToCart(id) {
      const product = findProduct(id);
      if (!product) return; // segurança: ignora ids que não existem mais na lista
  
      const existing = cart.find((item) => item.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id: product.id, name: product.name, emoji: product.emoji, price: product.price, qty: 1 });
      }
      renderCart();
      showToast(`${product.emoji} ${product.name} adicionado ao carrinho!`);
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
  
    /* ---------------- 9. ABERTURA E FECHAMENTO DO MODAL ---------------- */
  
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
  
    /* ---------------- 10. MONTAGEM DA MENSAGEM E ENVIO PARA O WHATSAPP ---------------- */
  
    function buildWhatsAppMessage(customer) {
      const lines = [];
  
      lines.push("🍫 PEDIDO JSL DOCES");
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
  
      lines.push("");
      lines.push(`Observações: ${customer.notes && customer.notes.trim() !== "" ? customer.notes.trim() : "nenhuma"}`);
  
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
        address: custAddressInput.value.trim(),
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
  
    /* ---------------- 11. EVENTOS ---------------- */
  
    // Delegação de eventos para os botões "Adicionar ao carrinho" (cards são gerados dinamicamente)
    productGrid.addEventListener("click", (e) => {
      const button = e.target.closest('[data-action="add"]');
      if (!button) return;
      addToCart(button.dataset.id);
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
  
    /* ---------------- 12. INICIALIZAÇÃO ---------------- */
    renderProductGrid();
    renderCart();
  })();