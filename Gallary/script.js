document.addEventListener('mousemove', (e) => {
    const cursorGlow = document.querySelector('.cursor-glow');
    cursorGlow.style.left = e.pageX + 'px';
    cursorGlow.style.top = e.pageY + 'px';
});
