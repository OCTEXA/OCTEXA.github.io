document.addEventListener("DOMContentLoaded", function () {
    const images = [
        'https://pixyshare.in/Gallary/image17.jpeg',
        'https://pixyshare.in/Gallary/image18.jpeg',
        'https://pixyshare.in/Gallary/image7.JPG',
        'https://pixyshare.in/Gallary/image20.jpeg',
        'https://pixyshare.in/Gallary/image19.jpeg',
        'https://pixyshare.in/Gallary/image21.jpeg'
        
    ];

    let currentIndex = 0;

    // Function to change the image in the big rectangular image holder
    function changeImage(index) {
        currentIndex += index;

        if (currentIndex < 0) {
            currentIndex = images.length - 1;
        } else if (currentIndex >= images.length) {
            currentIndex = 0;
        }

        const bigImageHolder = document.getElementById('bigImageHolder');
        bigImageHolder.style.backgroundImage = `url('${images[currentIndex]}')`;
    }

    // Set an interval to change the image every 5 seconds
    setInterval(() => {
        changeImage(1);
    }, 2500);

    // Function to handle manual navigation using buttons
    window.changeImage = changeImage;
});
