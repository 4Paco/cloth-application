use core::f32;

use nalgebra::{Point2, Point3, Vector2};

use crate::{drawable::Drawable, line::Line};
use itertools::TupleWindows;

pub struct WireNode {
    pub position: Point3<f32>,
    pub width: f32,
}

pub enum WireMaterial {
    NONE,
}

pub trait Profile {
    fn get_height(&self, x_normalized: f32) -> f32 {
        return x_normalized.cos();
    }
}

pub struct Wire {
    pub nodes: Vec<WireNode>,
    pub material: WireMaterial,
    pub profile: Box<dyn Profile>,
}

fn lerp(a: f32, b: f32, s: f32) -> f32 {
    b * s + a * (1. - s)
}

impl Drawable for Wire {
    fn get_height(&self, point: Point2<f32>) -> f32 {
        let mut height = None;
        for window in self.nodes.windows(2) {
            match &window {
                &[a, b] => {
                    let line = Line::new(a.position.xy(), b.position.xy());
                    let w1 = a.width;
                    let w2 = b.width;
                    let v_line: Vector2<f32> = line.end - line.start;
                    let v_point: Vector2<f32> = point - line.start;
                    let prog = v_point.dot(&v_line) / v_line.norm();
                    let d = (v_line - v_line.normalize() * v_point.dot(&v_line)).norm();
                    let max_d = lerp(w1, w2, prog);
                    if d < max_d {
                        height = Some(d / max_d);
                        break;
                    }
                }
                _ => (),
            }
        }
        height.unwrap_or(f32::INFINITY)
    }
}
