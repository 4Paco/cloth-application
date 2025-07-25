mod drawable;
mod line;
mod texture;
mod wire;

use std::{f32, path::Path};

use drawable::Drawable;
use image::{DynamicImage, Pixel, Rgb};
use indicatif::ParallelProgressIterator;
use itertools::Itertools;
use nalgebra::*;
// use noise::NoiseFn;
use noise::{NoiseFn, Perlin, Seedable, core::perlin::perlin_2d, utils::NoiseMapBuilder};
use texture::*;
use wire::{Material, Wire, WireNode};

use rayon::prelude::*;

#[derive(Default)]
struct World {
    wires: Vec<Wire>,
}

#[allow(unused)]
fn world_point_to_texture(texture: &Texture, point: Point2<f32>) -> Vector2<i32> {
    let texture_size = texture.size();
    point
        .coords
        .component_div(&texture.extent)
        .component_mul(&texture_size.map(|x| x as f32))
        .map(|x| x.round() as i32)
}

fn texture_point_to_world(
    point: Point2<u32>,
    texture_size: &Vector2<u32>,
    texture_extent: &Vector2<f32>,
) -> Point2<f32> {
    Vector2::new(point.x, texture_size.y - point.y)
        .map(|x| x as f32)
        .component_div(&texture_size.map(|x| x as f32))
        .component_mul(texture_extent)
        .into()
}

fn apply_function(texture: &mut Texture, world: &World, f: fn(&mut Rgb<f32>, &World, Point2<f32>)) {
    let texture_size = texture.size();
    let texture_extent = texture.extent;

    texture
        .image
        .par_enumerate_pixels_mut()
        .progress()
        .for_each(|(x, y, pixel)| {
            let texture_point: Point2<u32> = Point2::new(x, y);
            let world_point: Point2<f32> =
                texture_point_to_world(texture_point, &texture_size, &texture_extent);

            f(pixel, world, world_point)
        });
}

#[allow(unused)]
fn height_function(pixel: &mut Rgb<f32>, world: &World, world_point: Point2<f32>) {
    let z = world
        .wires
        .iter()
        .map(|w| w.get_height(world_point))
        .reduce(f32::max)
        .unwrap_or(-f32::INFINITY);

    // let v = clamp(z / 10., 0., 1.);
    // let v = if z.abs() == f32::INFINITY { 0. } else { z / 10. };
    let v = z / 10.;

    *pixel = image::Rgb([v, v, v]);
}

#[allow(unused)]
fn id_function(pixel: &mut Rgb<u8>, world: &World, world_point: Point2<f32>) {
    const MULTIPLIER: usize = 24;
    let z = world
        .wires
        .iter()
        .map(|w| w.get_height_with_id(world_point))
        .max_by(|x, y| x.0.partial_cmp(&y.0).unwrap());

    if let Some(index) = z {
        let bytes = index.1.to_le_bytes();
        *pixel = image::Rgb([bytes[0], bytes[1], bytes[2]]);
    }
}

#[allow(unused)]
fn alpha_function(pixel: &mut Rgb<f32>, world: &World, world_point: Point2<f32>) {
    let z = world
        .wires
        .iter()
        .map(|w| w.get_height(world_point))
        .any(|d| d.is_finite());

    let v = if z { 1. } else { 0. };

    *pixel = image::Rgb([v, v, v]);
}

#[allow(unused)]
fn albedo_function(pixel: &mut Rgb<f32>, world: &World, world_point: Point2<f32>) {
    let max = world
        .wires
        .iter()
        .map(|w| w.get_height(world_point))
        .position_max_by(|x, y| x.partial_cmp(y).unwrap());
    let a: Vector3<f32> = if let Some(i) = max {
        world.wires[i].get_albedo(world_point)
    } else {
        Vector3::new(0., 0., 0.)
    };
    *pixel = image::Rgb([a.x, a.y, a.z]);
}

#[allow(unused)]
fn normal_function(pixel: &mut Rgb<f32>, world: &World, world_point: Point2<f32>) {
    let (i, _) = world
        .wires
        .iter()
        .map(|w| w.get_height(world_point))
        .enumerate()
        .fold((0, -f32::INFINITY), |(acc_i, acc_e), (i, e)| {
            if e > acc_e { (i, e) } else { (acc_i, acc_e) }
        });
    let n: Vector3<f32> = world.wires[i].get_normal(world_point);
    *pixel = image::Rgb([n.x, n.y, n.z]);
}

struct SimpleColoredMaterial {
    color: Vector3<f32>,
}

impl Material for SimpleColoredMaterial {
    fn get_color(&self) -> Vector3<f32> {
        self.color
    }
}

fn periodic_noise_2d(perlin: &Perlin, x: f64, y: f64, period: f64) -> f64 {
    let nx = (x / period) * std::f64::consts::TAU; // TAU = 2π
    let ny = (y / period) * std::f64::consts::TAU;

    let x1 = nx.cos();
    let x2 = nx.sin();
    let y1 = ny.cos();
    let y2 = ny.sin();

    perlin.get([x1, x2, y1, y2])
}

#[allow(unused)]
fn generate_tissage(world: &mut World) {
    const COUNT_X: u32 = 24;
    const COUNT_Y: u32 = 24;

    let perlin_x: noise::Perlin = noise::Perlin::new(1234);
    let perlin_y: noise::Perlin = noise::Perlin::new(1234 + 42);

    let g_perlin = Perlin::new(42);
    // Wrap it in a periodic noise adapter
    // let perlin_w: noise::Perlin = noise::Perlin::new(1234 + 69);
    let perlin_scale: f64 = 10.;
    let perlin_strength: f64 = 0.02;

    let scale_x = 1. / (COUNT_X as f32);
    let scale_y = 1. / (COUNT_Y as f32);
    const RES: u32 = 8;

    let w_map = |w: f32| 0.018 + 0.001 * w as f32;

    for x in 0..=COUNT_X {
        let mut nodes: Vec<WireNode> = vec![];
        for y in 0..=COUNT_Y / 2 {
            let y_base = 2. * y as f32 * scale_y;
            for i in 0..RES {
                // 2*scale_x => step length
                // 2*scale_x/RES => micro_step length
                let y_interm = i as f32 / (RES as f32);
                let y_inter = y_base + y_interm * 2. * scale_x;
                let x_pos = x as f32 * scale_x;
                let y_pos = y_inter;
                let x_pos_noise = (if x == COUNT_X { 0. } else { x_pos });
                let y_index = y * RES + i;
                let y_pos_noise = if y_index == (COUNT_Y / 2 * RES + RES - 1) {
                    0.
                } else {
                    y_pos
                };

                let offset = perlin_strength
                    * Vector2::new(
                        // perlin_x.get([
                        //     perlin_scale * x_pos_noise as f64,
                        //     perlin_scale * y_pos_noise as f64,
                        // ]),
                        // perlin_y.get([
                        //     perlin_scale * x_pos_noise as f64,
                        //     perlin_scale * y_pos_noise as f64,
                        // ]),
                        periodic_noise_2d(
                            &perlin_x,
                            perlin_scale * x_pos as f64,
                            perlin_scale * y_pos as f64,
                            perlin_scale,
                        ),
                        periodic_noise_2d(
                            &perlin_y,
                            perlin_scale * x_pos as f64,
                            perlin_scale * y_pos as f64,
                            perlin_scale,
                        ),
                    );
                let w = periodic_noise_2d(
                    &perlin_x,
                    perlin_scale * x_pos as f64,
                    perlin_scale * y_pos as f64,
                    perlin_scale,
                );
                // let w = perlin_x.get([
                //     perlin_scale * x_pos_noise as f64,
                //     perlin_scale * y_pos_noise as f64,
                // ]);
                let w = w_map(w as f32);
                let mut node_index: usize = ((x % COUNT_X)
                    + ((x % COUNT_X) % 2) * COUNT_X
                    + (y % (COUNT_Y / 2)) * COUNT_X * 2)
                    as usize;
                if x % 2 == 0 {
                    if i > RES / 2 {
                        node_index = ((x % COUNT_X)
                            + ((x % COUNT_X) % 2) * COUNT_X
                            + ((y + 1) % (COUNT_Y / 2)) * COUNT_X * 2)
                            as usize;
                    }
                }
                // let mut node_index: usize = (x as usize % 2) * 24 + x as usize + y as usize * 24;
                // let mut node_index: usize =
                //     24 * (y % 24) as usize + (x % 2) as usize + 2 * (x % 24) as usize;
                // if x % 2 == 0 {
                //     if i > RES / 2 {
                //         node_index = (x as usize % 2) * 24 + x as usize + (y + 1) as usize * 24;
                //     }
                // }
                // let mut node_index: usize =
                //     48 * (y % 24) as usize + ((y % 24) as usize % 2) + 2 * (x % 24) as usize;
                // if x % 2 == 0 {
                //     if i > RES / 2 {
                //         node_index = 48 * ((y % 24) + 1) as usize
                //             + (((y % 24) + 1) as usize % 2)
                //             + 2 * (x % 24) as usize;
                //     }
                // }
                nodes.push(WireNode::new(
                    node_index,
                    Point3::new(
                        x_pos + offset.x as f32,
                        y_pos + offset.y as f32,
                        0.01 * (f32::two_pi() * y_interm
                            + f32::pi() / 2.
                            + f32::pi() * ((x % 2) as f32))
                            .sin(),
                    ),
                    w,
                ));
            }
        }
        let material = SimpleColoredMaterial {
            color: Vector3::new(0.8, 0.8, 0.8),
        };
        world.wires.push(Wire::new_from_nodes_with_material(
            nodes,
            true,
            Box::new(material),
        ));
    }

    for y in 0..=COUNT_Y {
        let mut nodes: Vec<WireNode> = vec![];
        for x in 0..=COUNT_X / 2 {
            let x_base = 2. * x as f32 * scale_x;
            for i in 0..RES {
                // scale_y => step length
                // scale_y/RES => micro_step length
                let x_interm = i as f32 / (RES as f32);
                let x_inter = x_base + x_interm * 2. * scale_y;
                // let w = 0.015;

                let x_pos = x_inter;
                let y_pos = y as f32 * scale_y;

                let offset = perlin_strength
                    * Vector2::new(
                        periodic_noise_2d(
                            &perlin_x,
                            perlin_scale * x_pos as f64,
                            perlin_scale * y_pos as f64,
                            perlin_scale,
                        ),
                        periodic_noise_2d(
                            &perlin_y,
                            perlin_scale * x_pos as f64,
                            perlin_scale * y_pos as f64,
                            perlin_scale,
                        ),
                        // perlin_x.get([
                        //     perlin_scale * x_pos_noise as f64,
                        //     perlin_scale * y_pos_noise as f64,
                        // ]
                        // ),
                        // perlin_y.get([
                        //     perlin_scale * x_pos_noise as f64,
                        //     perlin_scale * y_pos_noise as f64,
                        // ]),
                    );
                // let offset = perlin_strength
                //     * Vector2::new(
                //         perlin_x.get([
                //             perlin_scale * x_pos_noise as f64,
                //             perlin_scale * y_pos_noise as f64,
                //         ]),
                //         perlin_y.get([
                //             perlin_scale * x_pos_noise as f64,
                //             perlin_scale * y_pos_noise as f64,
                //         ]),
                //     );

                // let w = perlin_x.get([
                //     perlin_scale * x_pos_noise as f64,
                //     perlin_scale * y_pos_noise as f64,
                // ]);
                let w = periodic_noise_2d(
                    &perlin_x,
                    perlin_scale * x_pos as f64,
                    perlin_scale * y_pos as f64,
                    perlin_scale,
                );
                let w = w_map(w as f32);

                // let node_index: usize = 2 * (24 * 2 * y as usize + x as usize);
                // let mut node_index: usize =
                //     24 * (y % 24) as usize + 24 * ((x + 1) % 2) as usize + 2 * (x % 24) as usize;
                let mut node_index: usize = ((x % (COUNT_X / 2)) * 2
                    + (y % COUNT_Y) * COUNT_X
                    + ((y % COUNT_Y) + 1) % 2) as usize;
                if y % 2 == 1 {
                    if i > RES / 2 {
                        node_index = (((x + 1) % (COUNT_X / 2)) * 2
                            + (y % COUNT_Y) * COUNT_X
                            + ((y % COUNT_Y) + 1) % 2)
                            as usize;
                    }
                }
                // if y % 2 == 1 {
                //     if i > RES / 2 {
                //         node_index = (y as usize + 1) % 2
                //             + 2 * ((x + 1) as usize % 24)
                //             + 24 * (y as usize % 24);
                //         // node_index = 24 * (y % 24) as usize
                //         //     + 24 * (x % 2) as usize
                //         //     + 2 * ((x + 1) % 24) as usize;
                //     }
                // }
                // let mut node_index: usize =
                //     48 * (y % 24) as usize + (((y % 24) as usize + 1) % 2) + 2 * (x % 24) as usize;
                // if y % 2 == 1 {
                //     if i > RES / 2 {
                //         node_index = 48 * (y % 24) as usize
                //             + (((y % 24) as usize + 1) % 2)
                //             + 2 * ((x % 24) + 1) as usize;
                //     }
                // }

                nodes.push(WireNode::new(
                    node_index,
                    Point3::new(
                        x_pos + offset.x as f32,
                        y_pos + offset.y as f32,
                        0.01 * (f32::two_pi() * x_interm - f32::pi() / 2.
                            + f32::pi() * ((y % 2) as f32))
                            .sin(),
                    ),
                    w,
                ));
            }
        }
        let material = SimpleColoredMaterial {
            color: Vector3::new(0.8, 0.8, 0.8),
        };

        world.wires.push(Wire::new_from_nodes_with_material(
            nodes,
            true,
            Box::new(material),
        ));
    }
}

#[allow(unused)]
fn generate_single_strand(world: &mut World) {
    let mut nodes: Vec<WireNode> = vec![];
    nodes.push(WireNode::new(0, Point3::new(0.5, 0.2, 0.01), 0.05));
    nodes.push(WireNode::new(1, Point3::new(0.5, 0.5, 0.01), 0.05));
    nodes.push(WireNode::new(2, Point3::new(0.8, 0.5, 0.01), 0.05));

    world.wires.push(Wire::new_from_nodes(nodes, true));
}

#[allow(unused)]
fn map_texture_range(texture: &mut Texture) {
    texture
        .image
        .enumerate_pixels_mut()
        .for_each(|(_, _, p)| p.apply(|c| (c + 1.) / 2.));
}

#[allow(unused)]
fn map_texture_normalize(texture: &mut Texture) {
    let min = texture
        .image
        .enumerate_pixels()
        .map(|(_, _, w)| w.0[0])
        .filter(|x| x.abs() != f32::INFINITY)
        .reduce(f32::min)
        .unwrap_or(1.);

    let max = texture
        .image
        .enumerate_pixels()
        .map(|(_, _, w)| w.0[0])
        .filter(|x| x.abs() != f32::INFINITY)
        .reduce(f32::max)
        .unwrap_or(1.);
    texture
        .image
        .enumerate_pixels_mut()
        .for_each(|(_, _, p)| p.apply(|c| (c - min) / (max - min)));
}

fn save_texture<P: AsRef<Path>>(texture: Texture, path: P) {
    let dynamic_image = DynamicImage::from(texture.image);
    dynamic_image.into_rgb8().save(path).unwrap();
}

fn save_pbr(world: &mut World) {
    let texture_size = Vector2::new(1024, 1024);
    let extent = Vector2::new(1., 1.);
    let albedo = Texture::new(texture_size.x, texture_size.y, Vector2::new(1., 1.));
    let height = Texture::new(texture_size.x, texture_size.y, extent);
    let normal = Texture::new(texture_size.x, texture_size.y, extent);
    let alpha = Texture::new(texture_size.x, texture_size.y, extent);
    let mut ids = TextureU8::new(texture_size.x, texture_size.y, extent);
    // let mut roughness = Texture::new(1000, 1000, Vector2::new(1., 1.));
    // let mut ambient_occlusion = Texture::new(1000, 1000, Vector2::new(1., 1.));

    let textures: Vec<(
        Texture,
        fn(&mut Rgb<f32>, &World, Point2<f32>),
        Option<fn(&mut Texture)>,
        &str,
    )> = vec![
        (albedo, albedo_function, None, "albedo.png"),
        (
            height,
            height_function,
            Some(map_texture_normalize),
            "height.png",
        ),
        (
            normal,
            normal_function,
            Some(map_texture_range),
            "normal.png",
        ),
        (
            alpha,
            alpha_function,
            Some(map_texture_normalize),
            "alpha.png",
        ),
    ];

    textures
        .into_par_iter()
        .for_each(|(mut texture, function, optional_map_function, path)| {
            apply_function(&mut texture, &world, function);
            if let Some(map_function) = optional_map_function {
                map_function(&mut texture);
            }
            save_texture(texture, path);
        });

    ids.image
        .par_enumerate_pixels_mut()
        .progress()
        .for_each(|(x, y, pixel)| {
            let texture_point: Point2<u32> = Point2::new(x, y);
            let world_point: Point2<f32> =
                texture_point_to_world(texture_point, &texture_size, &extent);

            id_function(pixel, world, world_point)
        });
    ids.save("ids.png");
}

fn main() {
    let mut world = World::default();

    generate_tissage(&mut world);
    // generate_single_strand(&mut world);

    save_pbr(&mut world);
}
