use nalgebra::Point2;

pub trait Drawable {
    fn get_height(&self, point: Point2<f32>) -> f32;
}
