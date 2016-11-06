function showVideo(videoId) {
  const videos = document.getElementsByClassName('Video');
  let i;
  for (i = 0; i < videos.length; i++) {
    videos[i].classList.add('_hide');
  }
  document.getElementById(`video-${videoId}`).classList.remove('_hide');
}

document.getElementById('btn-1').addEventListener('mouseover', () => {
  showVideo('1');
});
document.getElementById('btn-2').addEventListener('mouseover', () => {
  showVideo('2');
});
document.getElementById('btn-3').addEventListener('mouseover', () => {
  showVideo('3');
});
document.getElementById('btn-4').addEventListener('mouseover', () => {
  showVideo('4');
});
