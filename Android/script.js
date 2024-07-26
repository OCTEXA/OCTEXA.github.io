const images = [
    'https://i.imgur.com/HtkZi5y.jpg',
    'https://i.imgur.com/aDlztxB.jpg',
    'https://i.imgur.com/DJGQPhe.jpg',
    'https://i.imgur.com/SUH0OY3.jpg',
    'https://i.imgur.com/PDh4HYU.jpg',
    'https://i.imgur.com/5T8vrhH.jpg',
    'https://i.imgur.com/NEaCWHD.jpg',
    'https://i.imgur.com/BHPsLrf.jpg',
    'https://i.imgur.com/y8gw15D.jpg',
    'https://i.imgur.com/RFCDszl.jpg',
    'https://i.imgur.com/NlOybN7.jpg',
    'https://i.imgur.com/AOjmBUh.jpg',
    'https://i.imgur.com/jcrPWPr.jpg',
    'https://i.imgur.com/0YWiJuK.jpg',
    'https://i.imgur.com/LA6HWlW.jpg',
    'https://i.imgur.com/flT1sYF.jpg',
    'https://i.imgur.com/4yAf6yA.jpg',
    'https://i.imgur.com/LF3eECA.jpg',
    'https://i.imgur.com/Yl2e3CC.jpg',
    'https://i.imgur.com/HtkZi5y.jpg',
    'https://i.imgur.com/aDlztxB.jpg',
    'https://i.imgur.com/0Bgsa4p.jpg',
    'https://i.imgur.com/PpLgbnm.jpg',
    'https://i.imgur.com/K9H3IA2.jpg'
    
];

// Carousel functionality
let currentImageIndex = 0;
const carouselImage = document.getElementById('carouselImage');
const prevButton = document.querySelector('.prev');
const nextButton = document.querySelector('.next');

function updateImage() {
    carouselImage.src = images[currentImageIndex];
    carouselImage.style.transition = 'opacity 1s ease-in-out'; // Smooth transition
    carouselImage.style.opacity = 0;

    setTimeout(() => {
        carouselImage.style.opacity = 1;
    }, 50);
}

prevButton.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    updateImage();
});

nextButton.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    updateImage();
});

// Automatic image change
setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    updateImage();
}, 3000); // Change every 3 seconds

// Initial image load
updateImage();

const imageContainer = document.querySelector('.image-container');

function createImageSet() {
    images.forEach(src => {
        const div = document.createElement('div');
        div.className = 'image-item';
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'Gallery Image';
        div.appendChild(img);
        imageContainer.appendChild(div);
    });
}

// Create two sets of images to create a seamless loop
createImageSet();
createImageSet();

// Clone the entire set to ensure smooth infinite scrolling
imageContainer.innerHTML += imageContainer.innerHTML;