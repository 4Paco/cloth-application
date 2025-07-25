use nalgebra::{Point2, Vector2, clamp};

pub struct Line {
    pub start: Point2<f32>,
    pub end: Point2<f32>,
}

pub enum DistanceResult {
    Caps { t: f32, d: f32 },
    Full { t: f32, d: f32 },
}

impl Line {
    pub fn new(start: Point2<f32>, end: Point2<f32>) -> Self {
        Self { start, end }
    }

    pub fn distance_to_point(&self, point: Point2<f32>) -> DistanceResult {
        let v_line: Vector2<f32> = self.end - self.start;
        let v_point: Vector2<f32> = point - self.start;
        let l2 = v_line.norm_squared();
        if l2 < f32::EPSILON {
            return DistanceResult::Full {
                t: 0.,
                d: v_point.norm(),
            };
        }
        let mut t = v_line.dot(&v_point) / l2;
        let cap = t < 0. || t > 1.;
        if cap {
            t = clamp(t, 0., 1.);
        }
        let projection = self.start + t * v_line;
        let d = (point - projection).norm();
        if cap {
            DistanceResult::Caps { t, d }
        } else {
            DistanceResult::Full { t, d }
        }
    }
}
