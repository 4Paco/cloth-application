use nalgebra::{Point2, Vector3};

pub trait Drawable {
    fn get_height(&self, point: Point2<f32>) -> f32;
    fn get_height_with_id(&self, point: Point2<f32>) -> (f32, usize);
    fn get_normal(&self, point: Point2<f32>) -> Vector3<f32>;
    fn get_albedo(&self, point: Point2<f32>) -> Vector3<f32>;
}
