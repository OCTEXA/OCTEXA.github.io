const images = [
    'https://pixyshare.in/Gallary/image6.JPG',
    'https://pixyshare.in/Gallary/image4.jpg'
];




// Carousel functionality
let currentImageIndex = 0;
const carouselImage = document.getElementById('carouselImage');
const prevButton = document.querySelector('.prev');
const nextButton = document.querySelector('.next');

function updateImage() {
    carouselImage.src = images[currentImageIndex];
}

prevButton.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    updateImage();
});

nextButton.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    updateImage();
});

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