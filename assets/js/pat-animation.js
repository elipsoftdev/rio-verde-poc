(() => {
  'use strict';

  const avatars = [...document.querySelectorAll('[data-pat-avatar]')];
  const images = avatars.map(avatar => avatar.querySelector('[data-pat-image]'));
  const panel = document.getElementById('rv-assistant-panel');
  const typing = document.getElementById('rv-chat-typing');
  if (!avatars.length || images.some(image => !image) || !panel || !typing) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const assets = {
    idle: 'assets/assistant/pat-idle.webp',
    wave: 'assets/assistant/pat-wave.webp',
    wink: 'assets/assistant/pat-wink.webp'
  };
  const MIN_ATTENTION_DELAY = 12000;
  const MAX_ATTENTION_DELAY = 18000;
  const WAVE_DURATION = 850;
  const WINK_DURATION = 600;
  let stateTimer = 0;
  let attentionTimer = 0;
  let imageTimer = 0;

  function displayState(state) {
    const next = reducedMotion.matches ? 'idle' : state;
    window.clearTimeout(imageTimer);
    const needsSwap = images.some(image => image.getAttribute('src') !== assets[next]);
    avatars.forEach(avatar => {
      avatar.dataset.patState = next;
      avatar.classList.remove('is-fading');
    });
    if (!needsSwap) return;
    if (reducedMotion.matches) {
      images.forEach(image => {
        if (image.getAttribute('src') !== assets[next]) image.src = assets[next];
      });
      return;
    }
    avatars.forEach(avatar => avatar.classList.add('is-fading'));
    imageTimer = window.setTimeout(() => {
      images.forEach(image => { image.src = assets[next]; });
      avatars.forEach(avatar => avatar.classList.remove('is-fading'));
      imageTimer = 0;
    }, 90);
  }

  function setState(state, duration, onComplete) {
    window.clearTimeout(stateTimer);
    displayState(state);
    if (!duration || reducedMotion.matches) return;
    stateTimer = window.setTimeout(() => {
      stateTimer = 0;
      displayState('idle');
      if (onComplete) onComplete();
    }, duration);
  }

  function clearAttention() {
    window.clearTimeout(attentionTimer);
    attentionTimer = 0;
  }

  function randomAttentionDelay() {
    return MIN_ATTENTION_DELAY + Math.floor(Math.random() * (MAX_ATTENTION_DELAY - MIN_ATTENTION_DELAY + 1));
  }

  function scheduleAttention() {
    clearAttention();
    if (reducedMotion.matches || !panel.hidden) return;
    attentionTimer = window.setTimeout(() => {
      attentionTimer = 0;
      if (reducedMotion.matches || !panel.hidden) return;
      setState('wink', WINK_DURATION, scheduleAttention);
    }, randomAttentionDelay());
  }

  function showWave() {
    clearAttention();
    if (reducedMotion.matches || !typing.hidden) {
      setState('idle');
      return;
    }
    setState('wave', WAVE_DURATION);
  }

  function handlePanelChange() {
    if (panel.hidden) {
      setState('idle');
      scheduleAttention();
    } else {
      showWave();
    }
  }

  function handleTypingChange() {
    const isTyping = !typing.hidden;
    if (isTyping) setState('idle');
    avatars.forEach(avatar => {
      avatar.classList.toggle('is-typing', isTyping && avatar.classList.contains('rv-avatar-header') && !reducedMotion.matches);
    });
  }

  function noteInteraction() {
    clearAttention();
    if (panel.hidden) scheduleAttention();
  }

  new MutationObserver(handlePanelChange).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(handleTypingChange).observe(typing, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('pointerdown', noteInteraction, { passive: true });
  document.addEventListener('keydown', noteInteraction);

  const handleMotionPreferenceChange = event => {
    if (event.matches) {
      clearAttention();
      window.clearTimeout(stateTimer);
      stateTimer = 0;
      setState('idle');
      avatars.forEach(avatar => avatar.classList.remove('is-typing'));
    } else if (panel.hidden) {
      scheduleAttention();
    }
  };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', handleMotionPreferenceChange);
  else reducedMotion.addListener(handleMotionPreferenceChange);

  if (reducedMotion.matches) setState('idle');
  else {
    setState('wave', WAVE_DURATION);
    scheduleAttention();
  }
})();
