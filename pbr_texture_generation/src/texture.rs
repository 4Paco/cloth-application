use std::path::Path;

use image::{DynamicImage, ImageBuffer, Rgb, Rgb32FImage};
use nalgebra::*;

pub struct Texture {
    pub image: Rgb32FImage,
    pub extent: Vector2<f32>,
}

pub struct TextureU8 {
    pub image: ImageBuffer<Rgb<u8>, Vec<u8>>,
    pub extent: Vector2<f32>,
}

impl Texture {
    pub fn new(width: u32, height: u32, extent: Vector2<f32>) -> Self {
        Self {
            image: Rgb32FImage::new(width, height),
            extent,
        }
    }
    pub fn size(&self) -> Vector2<u32> {
        Vector2::new(self.image.width(), self.image.height())
    }
}

impl TextureU8 {
    pub fn new(width: u32, height: u32, extent: Vector2<f32>) -> Self {
        Self {
            image: ImageBuffer::new(width, height),
            extent,
        }
    }
    pub fn size(&self) -> Vector2<u32> {
        Vector2::new(self.image.width(), self.image.height())
    }

    pub fn save<P: AsRef<Path>>(self, path: P) {
        let dynamic_image = DynamicImage::from(self.image);
        dynamic_image.into_rgb8().save(path).unwrap();
    }
}
