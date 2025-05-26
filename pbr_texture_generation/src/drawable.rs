use nalgebra::{Point2, Vector3};

pub trait Drawable {
    fn get_height(&self, point: Point2<f32>) -> f32;
    fn get_normal(&self, point: Point2<f32>) -> Vector3<f32>;
}
