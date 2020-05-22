
export const loadImage = (url) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'Anonymous';
  image.onload = () => { resolve(image); };
  image.onerror = () => {
    reject('ERROR : Image cannot be loaded');
  };
  image.src = url;
});

export const loadVideo = (url, { width = 512, height = 512, loop = false, muted = false } = {}) => {
  return new Promise((resolve, reject) => {
    const videoPlayer = document.createElement('video');

    videoPlayer.width = width;
    videoPlayer.height = height;

    videoPlayer.loop = loop;
    videoPlayer.muted = muted;
    const source = document.createElement('source');
    source.id = 'mp4';
    source.type = 'video/mp4';
    videoPlayer.appendChild(source);

    if (!videoPlayer.canPlayType('video/mp4')) {
      reject();
      return;
    }

    videoPlayer.addEventListener('canplaythrough', () => {
      resolve(videoPlayer);
    });
    videoPlayer.src = url;
    if (videoPlayer.readyState > 3) {
      resolve(videoPlayer);
    }
  });
}