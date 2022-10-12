use actix_web::{
    get, post,
    web::{self, Json},
    App, HttpServer,
};
use anyhow::Result;
use enum_map::Enum;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, env};
use std::net::IpAddr;
use std::str::FromStr;
use unleash_api_client::{client, Client, Context};
use unleash_api_client::client::Variant;
use unleash_api_client::context::IPAddress;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContextRes {
    #[serde(rename = "userId")]
    pub user_id: Option<String>,
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
    #[serde(rename = "remoteAddress")]
    pub remote_address: Option<String>,
    #[serde(default)]
    pub properties: HashMap<String, String>,
    #[serde(default, rename = "appName")]
    pub app_name: String,
    #[serde(default)]
    pub environment: String,
}

impl From<ContextRes> for Context {
    fn from(c: ContextRes) -> Self {
        Context {
            user_id: c.user_id,
            session_id: c.session_id,
            remote_address: c.remote_address.map(|r| IPAddress(IpAddr::from_str(r.as_str()).unwrap())),
            properties: c.properties,
            app_name: c.app_name,
            environment: c.environment
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EnabledResponse{
    pub name: String,
    pub enabled: bool,
    pub context: ContextRes
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VariantRes {
    pub name: String,
    pub payload: HashMap<String, String>,
    pub enabled: bool,
}

impl From<Variant> for VariantRes {
    fn from(v: Variant) -> Self {
        VariantRes {
            name: v.name,
            payload: v.payload,
            enabled: v.enabled
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VariantResponse {
    pub name: String,
    pub context: ContextRes,
    pub enabled: VariantRes
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ToggleRequest {
    pub toggle: String,
    pub context: ContextRes
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

fn toggle_is_enabled(client: &Client<UserFeatures, reqwest::Client>, name: String, context: Context) -> bool {
    client.is_enabled_str(name.as_str(), Some(&context), false)
}

#[post("/is-enabled")]
pub async fn is_enabled(client: web::Data<Client<UserFeatures, reqwest::Client>>, request: Json<ToggleRequest>) -> Json<EnabledResponse> {
    let req = request.into_inner();
    let response = EnabledResponse {
        name: req.toggle.clone(),
        enabled: toggle_is_enabled(client.as_ref(), req.toggle.clone(), req.context.clone().into()),
        context: req.context
    };
    Json(response)
}

fn get_variant(client: &Client<UserFeatures, reqwest::Client>, name: String, context: Context) -> Variant {
    client.get_variant_str(name.as_str(), &context)
}
#[post("/variant")]
pub async fn variant(client: web::Data<Client<UserFeatures, reqwest::Client>>, request: Json<ToggleRequest>) -> Json<VariantResponse> {
    let req = request.into_inner();
    let variant = VariantResponse {
        name: req.toggle.clone(),
        context: req.context.clone(),
        enabled: get_variant(client.as_ref(), req.toggle.clone(), req.context.clone().into()).into()
    };
    Json(variant)
}

#[allow(non_camel_case_types)]
#[derive(Debug, Deserialize, Serialize, Enum, Clone)]
pub enum UserFeatures {
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
        .enable_string_features()
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
            .service(variant)
            .service(is_enabled)
    });

    server.bind(("0.0.0.0", port))?.run().await?;

    Ok(())
}
