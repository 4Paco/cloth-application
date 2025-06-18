use pbr_rendering::run;

fn main() {
    cfg_if::cfg_if! {
        if #[cfg(target_arch = "wasm32")] {
            use tracing_subscriber::fmt::format::Pretty;
            use tracing_subscriber::prelude::*;
            use tracing_web::{MakeWebConsoleWriter, performance_layer};
            std::panic::set_hook(Box::new(console_error_panic_hook::hook));
            let fmt_layer = tracing_subscriber::fmt::layer()
                .with_ansi(false) // Only partially supported across browsers
                .without_time()   // std::time is not available in browsers, see note below
                .with_writer(MakeWebConsoleWriter::new()); // write events to the console
            let perf_layer = performance_layer()
                .with_details_from_fields(Pretty::default());

            tracing_subscriber::registry()
                .with(fmt_layer)
                .with(perf_layer)
                .init(); // Install these as subscribers to tracing events
        } else {
            tracing_subscriber::fmt::init();
        }
    }

    run().unwrap();
}
