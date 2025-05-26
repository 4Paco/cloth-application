//! An example of generating julia fractals.

mod drawable;
mod line;
mod texture;
mod wire;

use std::f32;

use drawable::Drawable;
use image::Rgb32FImage;
use line::*;
use nalgebra::*;
use texture::*;
use wire::Wire;

#[derive(Default)]
struct World {
    wires: Vec<Wire>,
}

fn world_point_to_texture(texture: &Texture, point: Point2<f32>) -> Vector2<i32> {
    let texture_size = texture.size();
    point
        .coords
        .component_div(&texture.extent)
        .component_mul(&texture_size.map(|x| x as f32))
        .map(|x| x.round() as i32)
}

fn texture_point_to_world(texture: &Texture, point: Point2<u32>) -> Point2<f32> {
    let texture_size = texture.size();
    point
        .coords
        .map(|x| x as f32)
        .component_mul(&texture.extent)
        .component_div(&texture_size.map(|x| x as f32))
        .into()
}

fn main() {
    let imgx = 800;
    let imgy = 800;

    let scalex = 3.0 / imgx as f32;
    let scaley = 3.0 / imgy as f32;

    // Create a new ImgBuf with width: imgx and height: imgy
    let mut imgbuf = image::ImageBuffer::new(imgx, imgy);

    // Iterate over the coordinates and pixels of the image
    for (x, y, pixel) in imgbuf.enumerate_pixels_mut() {
        let r = (0.3 * x as f32) as u8;
        let b = (0.3 * y as f32) as u8;
        *pixel = image::Rgb([r, 0, b]);
    }

    let world = World::default();
    let texture = Texture::new(100, 100, Vector2::new(1., 1.));

    // A redundant loop to demonstrate reading image data
    for x in 0..imgx {
        for y in 0..imgy {
            let pixel = imgbuf.get_pixel_mut(x, y);

            let texture_point: Point2<u32> = Point2::new(y, x);
            let world_point: Point2<f32> = texture_point_to_world(&texture, texture_point);

            let h = -world
                .wires
                .iter()
                .map(|w| w.get_height(world_point))
                .reduce(f32::min)
                .unwrap_or(f32::INFINITY);

            let v: u8 = (h / 10.) as u8;

            *pixel = image::Rgb([v, v, v]);
        }
    }

    // Save the image as “fractal.png”, the format is deduced from the path
    imgbuf.save("fractal.png").unwrap();
}
