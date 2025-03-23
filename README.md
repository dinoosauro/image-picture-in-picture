# image-picture-in-picture

A simple tool that permits to put images and PDF files in Picture-in-Picture
mode.

## Usage

<video src="./readme-assets/2025-03-23 21-21-02.mp4">
</video>

Open [the website](https://dinoosauro.github.io/image-picture-in-picture/), and
choose some images with the `Pick images` button. Now, click the
`Go into Picture-in-Picture mode`.

### Settings

As you can see from the video above, you also have some settings you can change.

- You can change the interval between each image change (in milliseconds);
- Or you can choose to keep the same aspect ratio for the window, and the images
  with a different aspect ratio will be put at the left or at the right of the
  Picture-in-Picture;
  - This can be really useful if you want to avoid continuous resizing of the
    Picture-in-Picture window
- Or you can choose to use the third-party heic2any library to decode HEIC
  images, in case your browser doesn't support them (or you need to decode
  multiple embedded HEIC images in a single container)
- Or you can change the theme (even if the dark theme is objectively superior)

### The Picked Images tab

In the Picked Images tab, you can see all the images you've chosen (you might
need to scroll to see them all). By clicking on one of them, you can choose to
block it (so, the image will be shown in the Picture-in-Picture video and it
won't change), or to delete it from the list.

![The dialog that appears when clicking on an image](./readme-assets/Screenshot%202025-03-23%20alle%2021.31.12.jpg)

## Progressive Web App

Since this app runs completely offline, you can install this as a Progressive
Web App. Some third-party libraries that can be used for image/PDF decoding are
automatically downloaded by a service worker.
