use nalgebra::*;

pub struct Line {
    pub start: Point2<f32>,
    pub end: Point2<f32>,
}

impl Line {
    pub fn new(start: Point2<f32>, end: Point2<f32>) -> Self {
        Self { start, end }
    }
}
