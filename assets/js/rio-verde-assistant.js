(() => {
  'use strict';

  const CHAT_MODE = "demo";
  window.rioVerdeChatMode = CHAT_MODE;
  const rioVerdeKnowledge = {
    brand: {
      name: 'Río Verde',
      summary: 'Juegos y cuadernos de actividades que acercan a niños y familias a la biodiversidad venezolana. Una invitación a descubrir especies mientras aprenden jugando.'
    },
    products: [
      { name: 'Fauna venezolana', aliases: ['fauna', 'animales', 'fauna venezolana'], description: '30 especies emblemáticas para aprender, reconocer y jugar en familia.' },
      { name: 'Caimanes y cocodrilos', aliases: ['caiman', 'caimanes', 'cocodrilo', 'cocodrilos'], description: 'Actividades para descubrir especies, hábitats y curiosidades de nuestra biodiversidad.' },
      { name: 'Tortugas', aliases: ['tortuga', 'tortugas'], description: 'Una forma entretenida de conocer a estos increíbles reptiles venezolanos.' },
      { name: 'Primates', aliases: ['primate', 'primates', 'mono', 'monos'], description: 'Juegos y contenidos educativos sobre los primates presentes en Venezuela.' },
      { name: 'Sapos y ranas', aliases: ['sapo', 'sapos', 'rana', 'ranas', 'anfibio', 'anfibios'], description: 'Aprender jugando sobre anfibios, ecosistemas y conservación.' },
      { name: 'Para regalar y aprender', aliases: ['regalo', 'regalar', 'para regalar', 'regalar y aprender'], description: 'Combina materiales para crear una experiencia educativa inspirada en Venezuela.' }
    ],
    allies: ['La Sopa de Letras', 'Kalathos', 'La Fogata Experience', 'Zoo Leslie Pantin'],
    instagram: { handle: '@rioverdeoficial', url: 'https://www.instagram.com/rioverdeoficial/' }
  };

  const launcher = document.getElementById('rv-assistant-launcher');
  const panel = document.getElementById('rv-assistant-panel');
  const closeButton = document.getElementById('rv-assistant-close');
  const messages = document.getElementById('rv-chat-messages');
  const typing = document.getElementById('rv-chat-typing');
  const suggestions = document.getElementById('rv-chat-suggestions');
  const form = document.getElementById('rv-chat-form');
  const input = document.getElementById('rv-chat-input');
  const assistant = document.getElementById('rv-assistant');
  if (!launcher || !panel || !closeButton || !messages || !typing || !suggestions || !form || !input || !assistant) return;

  const state = { greeted: false, pendingChoice: null, lastProduct: null, replying: false };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9@]+/g, ' ').trim();
  const includesAny = (text, words) => words.some(word => text.includes(normalize(word)));
  const productFor = text => rioVerdeKnowledge.products.find(product => product.aliases.some(alias => text.includes(normalize(alias)))) || null;
  const productMessage = product => 'Hola Río Verde, quiero más información sobre ' + product.name + '.';
  const generalMessage = 'Hola Río Verde, estuve viendo sus libros en la página y quiero más información.';

  function continueWithWhatsApp(message) {
    if (typeof window.rioVerdeOpenWhatsApp === 'function') window.rioVerdeOpenWhatsApp(message);
  }

  function makeReply(text, options) {
    return Object.assign({ text: text, suggestions: [], actions: [] }, options || {});
  }

  function productReply(product, intro) {
    const lead = intro ? intro + ' ' : 'Tenemos una propuesta sobre ' + product.name + '. ' + product.description + ' ';
    return makeReply(lead + '¿Quieres verla en el catálogo?', {
      product: product,
      suggestions: ['Ver otros libros', 'Ayúdame a elegir'],
      actions: [
        { label: 'Ver producto', type: 'product', product: product.name },
        { label: 'Continuar por WhatsApp', type: 'whatsapp', message: productMessage(product) }
      ]
    });
  }

  function productListReply() {
    return makeReply('Estos son los productos que aparecen en el catálogo de Río Verde. ¿Cuál te gustaría explorar?', {
      suggestions: rioVerdeKnowledge.products.map(product => product.name)
    });
  }

  function demoRioVerdeProvider(request) {
    const text = normalize(request.text);
    const context = request.context;
    const matchedProduct = productFor(text);
    const product = matchedProduct || context.lastProduct;
    const noProduct = matchedProduct === null;
    const unavailable = /\b(precio|precios|cuanto|cuesta|costos?|stock|existencia|disponible|disponibilidad|unidades|agotado|agotada|envio|envios|envian|entrega|delivery|pago|pagos|pagar|pago movil|metodos de pago|formas de pago|transferencia|transferencias|horario|horarios|abren|abierto|abierta|atienden|edad|edades)\b/.test(text);
    const asksPurchase = /\b(comprar|compra|pedido|pedir|ordeno|ordenar|quiero mas informacion|quiero informacion|quiero info|me interesa|continuar por whatsapp)\b/.test(text);
    const asksHelp = includesAny(text, ['ayudame a elegir', 'ayuda para elegir', 'no se cual', 'no se que elegir', 'recomiend', 'elegir']);

    if (unavailable) {
      context.pendingChoice = null;
      return makeReply('Esa información puede variar y no está incluida en esta demostración. Si quieres, puedo ayudarte a continuar la consulta por WhatsApp.', {
        suggestions: ['Ver nuestros libros', 'Ayúdame a elegir'],
        actions: [{ label: 'Continuar por WhatsApp', type: 'whatsapp', message: generalMessage }]
      });
    }

    if (context.pendingChoice === 'purpose') {
      context.pendingChoice = null;
      if (includesAny(text, ['para regalar', 'regalo', 'regalar'])) {
        const gift = rioVerdeKnowledge.products.find(item => item.name === 'Para regalar y aprender');
        context.lastProduct = gift;
        return productReply(gift, '¡Qué buena idea! 🎁 Para regalar y aprender reúne una opción educativa inspirada en Venezuela.');
      }
      if (includesAny(text, ['aprender en familia', 'familia'])) {
        const fauna = rioVerdeKnowledge.products[0];
        context.lastProduct = fauna;
        return productReply(fauna, 'Para aprender y jugar en familia, puedes explorar Fauna venezolana. ' + fauna.description);
      }
      if (includesAny(text, ['animal especifico', 'animal', 'especie'])) {
        return makeReply('¿Qué animal te llama más la atención?', {
          suggestions: ['Fauna venezolana', 'Caimanes y cocodrilos', 'Tortugas', 'Primates', 'Sapos y ranas']
        });
      }
      if (includesAny(text, ['explorar', 'solo quiero'])) return productListReply();
    }

    if (context.pendingChoice === 'animal') context.pendingChoice = null;

    if (asksPurchase) {
      if (product && !noProduct) {
        context.lastProduct = product;
        return makeReply('¡Claro! Puedo ayudarte a consultar por ' + product.name + '. El mensaje quedará preparado en WhatsApp para que tú decidas si lo envías.', {
          product: product,
          suggestions: ['Ver otros libros', 'Ayúdame a elegir'],
          actions: [
            { label: 'Ver producto', type: 'product', product: product.name },
            { label: 'Continuar por WhatsApp', type: 'whatsapp', message: productMessage(product) }
          ]
        });
      }
      if (noProduct && context.lastProduct) {
        return makeReply('Puedo ayudarte a consultar por ' + context.lastProduct.name + '. El mensaje se abrirá preparado en WhatsApp y tú decides si lo envías.', {
          product: context.lastProduct,
          actions: [{ label: 'Continuar por WhatsApp', type: 'whatsapp', message: productMessage(context.lastProduct) }],
          suggestions: ['Ver producto', 'Ver otros libros']
        });
      }
      return makeReply('Con gusto te ayudamos a conocer las opciones. El mensaje quedará preparado en WhatsApp para que tú decidas si lo envías.', {
        actions: [{ label: 'Continuar por WhatsApp', type: 'whatsapp', message: generalMessage }],
        suggestions: ['Ver nuestros libros', 'Ayúdame a elegir']
      });
    }

    if (asksHelp) {
      context.pendingChoice = 'purpose';
      return makeReply('¡Claro! ¿Para qué lo estás buscando?', {
        suggestions: ['Para regalar', 'Para aprender en familia', 'Me interesa un animal específico', 'Solo quiero explorar']
      });
    }

    if (includesAny(text, ['donde puedo conseguir', 'donde los consigo', 'puntos aliados', 'libreria', 'librerias', 'donde comprar', 'donde venden'])) {
      const names = rioVerdeKnowledge.allies.join(', ');
      return makeReply('El sitio de Río Verde presenta estos puntos aliados: ' + names + '. Esta demostración no tiene información de horarios ni disponibilidad. ¿Quieres ver los libros?', {
        suggestions: ['Ver nuestros libros', 'Ayúdame a elegir']
      });
    }

    if (includesAny(text, ['instagram', 'redes sociales', '@rioverdeoficial'])) {
      return makeReply('La red social confirmada de Río Verde es Instagram: ' + rioVerdeKnowledge.instagram.handle + '.', {
        suggestions: ['Ver nuestros libros', 'Ayúdame a elegir']
      });
    }

    if (includesAny(text, ['que es rio verde', 'quien es rio verde', 'sobre rio verde', 'rio verde'])) {
      return makeReply(rioVerdeKnowledge.brand.summary, { suggestions: ['Ver nuestros libros', 'Ayúdame a elegir'] });
    }

    if (includesAny(text, ['aprender jugando', 'biodiversidad', 'fauna venezolana', 'fauna'])) {
      const fauna = rioVerdeKnowledge.products[0];
      context.lastProduct = fauna;
      return productReply(fauna, 'Río Verde invita a descubrir la biodiversidad venezolana aprendiendo y jugando. Puedes explorar Fauna venezolana. ' + fauna.description);
    }

    if (matchedProduct) {
      context.lastProduct = matchedProduct;
      const isGift = matchedProduct.name === 'Para regalar y aprender';
      const intro = isGift ? '¡Qué buena idea! 🎁 Para regalar y aprender: ' + matchedProduct.description : null;
      return productReply(matchedProduct, intro);
    }

    if (noProduct && context.lastProduct && includesAny(text, ['cuentame mas', 'mas detalles', 'mas sobre eso', 'hablame de ese libro', 'ver ese producto'])) {
      return productReply(context.lastProduct);
    }

    if (includesAny(text, ['libros', 'cuadernos', 'catalogo', 'productos', 'ver nuestros libros', 'explorar'])) return productListReply();

    if (/\b(buenas?|hola|saludos|hey)\b/.test(text)) {
      return makeReply('¡Hola! 🌿 Puedo ayudarte a conocer los libros de Río Verde, explorar puntos aliados o elegir una opción para aprender y compartir.', {
        suggestions: ['Ver nuestros libros', 'Ayúdame a elegir', '¿Dónde puedo conseguirlos?']
      });
    }

    return makeReply('Estoy aquí para ayudarte con Río Verde, sus libros y contenidos sobre biodiversidad 🌿. Si quieres, puedo ayudarte a encontrar uno de nuestros productos.', {
      suggestions: ['Ver nuestros libros', 'Ayúdame a elegir']
    });
  }

  // The response provider is the seam for a future integration; today only the local demo is enabled.
  const chatProvider = CHAT_MODE === 'demo' ? demoRioVerdeProvider : null;

  function timestamp() {
    return new Intl.DateTimeFormat('es-VE', { hour: 'numeric', minute: '2-digit' }).format(new Date());
  }

  function scrollToLatest() {
    requestAnimationFrame(() => { messages.scrollTop = messages.scrollHeight; });
  }

  function addMessage(text, role, response) {
    const item = document.createElement('article');
    item.className = 'rv-chat-message' + (role === 'user' ? ' is-user' : ' is-assistant');
    const bubble = document.createElement('div');
    bubble.className = 'rv-chat-bubble';
    bubble.textContent = text;
    item.append(bubble);
    const time = document.createElement('time');
    time.className = 'rv-chat-time';
    time.dateTime = new Date().toISOString();
    time.textContent = timestamp();
    item.append(time);

    if (response && Array.isArray(response.actions) && response.actions.length) {
      const actionGroup = document.createElement('div');
      actionGroup.className = 'rv-chat-actions';
      actionGroup.setAttribute('aria-label', 'Acciones disponibles');
      response.actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'rv-chat-action' + (action.type === 'whatsapp' ? ' is-whatsapp' : '');
        button.type = 'button';
        button.textContent = action.label;
        if (action.type === 'product') {
          button.addEventListener('click', () => {
            if (typeof window.rioVerdeShowProduct === 'function') window.rioVerdeShowProduct(action.product);
          });
        } else if (action.type === 'whatsapp') {
          button.addEventListener('click', () => continueWithWhatsApp(action.message));
        }
        actionGroup.append(button);
      });
      item.append(actionGroup);
    }

    messages.append(item);
    scrollToLatest();
  }

  function setSuggestions(options) {
    suggestions.replaceChildren();
    (options || []).forEach(label => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => sendMessage(label));
      suggestions.append(button);
    });
  }

  function sendMessage(rawText) {
    const text = String(rawText || '').trim();
    if (!text || state.replying) return;
    addMessage(text, 'user');
    input.value = '';
    setSuggestions([]);
    state.replying = true;
    typing.hidden = false;
    scrollToLatest();

    window.setTimeout(() => {
      let response;
      try {
        response = chatProvider({ text: text, context: state });
      } catch (_) {
        response = makeReply('Estoy aquí para ayudarte con Río Verde, sus libros y contenidos sobre biodiversidad 🌿.', {
          suggestions: ['Ver nuestros libros', 'Ayúdame a elegir']
        });
      }
      if (response.product) state.lastProduct = response.product;
      addMessage(response.text, 'assistant', response);
      setSuggestions(response.suggestions);
      state.replying = false;
      typing.hidden = true;
      input.focus({ preventScroll: true });
    }, reducedMotion.matches ? 100 : 360);
  }

  function openPanel() {
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    if (!state.greeted) {
      addMessage('¡Hola! 🌿 Soy el asistente de Río Verde. Puedo ayudarte a conocer nuestros libros, encontrar una opción para regalar o aprender más sobre nuestra biodiversidad. ¿Qué te gustaría descubrir?', 'assistant');
      setSuggestions(['Ver nuestros libros', 'Ayúdame a elegir', 'Me interesan las tortugas', '¿Dónde puedo conseguirlos?', '¿Qué es Río Verde?']);
      state.greeted = true;
    }
    window.requestAnimationFrame(() => input.focus({ preventScroll: true }));
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    assistant.classList.remove('is-keyboard-open');
    launcher.focus({ preventScroll: true });
  }

  launcher.addEventListener('click', () => panel.hidden ? openPanel() : closePanel());
  closeButton.addEventListener('click', closePanel);
  form.addEventListener('submit', event => {
    event.preventDefault();
    sendMessage(input.value);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      closePanel();
    }
  });

  if (window.visualViewport) {
    const updateKeyboardLayout = () => {
      const viewport = window.visualViewport;
      assistant.style.setProperty('--rv-vv-height', viewport.height + 'px');
      assistant.style.setProperty('--rv-vv-offset-top', viewport.offsetTop + 'px');
      const keyboardVisible = !panel.hidden && document.activeElement === input && window.innerHeight - viewport.height > 120;
      assistant.classList.toggle('is-keyboard-open', keyboardVisible);
    };
    window.visualViewport.addEventListener('resize', updateKeyboardLayout, { passive: true });
    window.visualViewport.addEventListener('scroll', updateKeyboardLayout, { passive: true });
    input.addEventListener('blur', () => window.setTimeout(updateKeyboardLayout, 100));
    input.addEventListener('focus', updateKeyboardLayout);
  }
})();
