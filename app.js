function slide(trackId, direction) {
    const track = document.getElementById(trackId);

    track.scrollBy({
        left: direction * 1200,
        behavior: 'smooth'
    });
}
