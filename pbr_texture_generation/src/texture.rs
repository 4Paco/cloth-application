use image::Rgb32FImage;
use nalgebra::*;

pub struct Texture {
    pub image: Rgb32FImage,
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
