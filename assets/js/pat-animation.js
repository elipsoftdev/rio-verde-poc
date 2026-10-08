(() => {
  'use strict';

  const avatars = [...document.querySelectorAll('[data-pat-avatar]')];
  const panel = document.getElementById('rv-assistant-panel');
  const typing = document.getElementById('rv-chat-typing');
  if (!avatars.length || !panel || !typing) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MIN_ATTENTION_DELAY = 12000;
  const MAX_ATTENTION_DELAY = 18000;
  const WAVE_DURATION = 1000;
  const WINK_DURATION = 700;
  let stateTimer = 0;
  let attentionTimer = 0;

  function setState(state, duration, onComplete) {
    window.clearTimeout(stateTimer);
    avatars.forEach(avatar => { avatar.dataset.patState = state; });
    if (!duration || reducedMotion.matches) return;
    stateTimer = window.setTimeout(() => {
      avatars.forEach(avatar => { avatar.dataset.patState = 'idle'; });
      stateTimer = 0;
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

  avatars.forEach(avatar => {
    const idleImage = avatar.querySelector('[data-pat-frame="idle"]');
    if (!idleImage) return;
    const markReady = () => {
      if (idleImage.complete && idleImage.naturalWidth > 0) avatar.classList.add('has-pat-assets');
    };
    if (idleImage.complete) markReady();
    else idleImage.addEventListener('load', markReady, { once: true });
  });

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
