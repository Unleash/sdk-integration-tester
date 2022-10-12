use actix_web::{
    get, post,
    web::{self, Json},
    App, HttpServer,
};
use anyhow::Result;
use enum_map::Enum;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, env};
use unleash_api_client::{client, Context};


pub struct EnabledResponse{
    pub name: String,
    pub enabled: bool,
    pub context: Context
}

#[get("/ready")]
pub async fn ready() -> Json<HashMap<String, String>> {
    let mut response = HashMap::new();
    response.insert("status".to_string(), "ok".to_string());
    Json(response)
}

#[get("/")]
pub async fn base_url() -> Json<HashMap<String, String>> {
    let mut response = HashMap::new();
    response.insert("status".to_string(), "ok".to_string());
    Json(response)
}

#[post("/is-enabled")]
pub async fn is_enabled() -> Json() {

}

#[allow(non_camel_case_types)]
#[derive(Debug, Deserialize, Serialize, Enum, Clone)]
enum UserFeatures {
    sadness,
}

#[actix_web::main]
async fn main() -> Result<(), anyhow::Error> {
    let api_key = env::var("API_KEY").expect("You need to set the API key, please");
    let api_url = env::var("API_URL").expect("You need to set the Unleash URL, please");
    let app_name = "rust-test-server";
    let instance_id = "rust-instance-id";

    let port: u16 = env::var("PORT")
        .unwrap_or("5500".to_string())
        .parse()
        .unwrap();

    let server = HttpServer::new(move || {
        let client = client::ClientBuilder::default()
        .interval(500)
        .into_client::<UserFeatures, reqwest::Client>(
            &api_url,
            app_name,
            instance_id,
            Some(api_key.clone()),
        ).expect("failed to init the rust client, this is fatal... because I don't feel like dealing with it");

        App::new()
            .app_data(web::Data::new(client))
            .service(ready)
            .service(base_url)
    });

    server.bind(("0.0.0.0", port))?.run().await?;

    Ok(())
}
