using Unleash;
using Unleash.ClientFactory;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var port = Environment.GetEnvironmentVariable("PORT") ?? "5133";
var url = Environment.GetEnvironmentVariable("UNLEASH_URL");
var apiKey = Environment.GetEnvironmentVariable("UNLEASH_API_TOKEN");

var settings = new UnleashSettings()
{
  AppName = "dotnet-test-server",
  UnleashApi = new Uri(url),
  CustomHttpHeaders = new Dictionary<string, string>()
    {
      {"Authorization", apiKey }
    },
};

var unleashFactory = new UnleashClientFactory();

IUnleash unleash = unleashFactory.CreateClient(settings, synchronousInitialization: true);

app.MapGet("/ready", () =>
{
  return new
  {
    status = "ok"
  };
});

app.MapPost("/is-enabled", (IsEnabledBody body) =>
{
  return new
  {
    name = body.toggle,
    enabled = unleash.IsEnabled(body.toggle, body.context),
    context = body.context,
  };
});

app.MapPost("/variant", (IsEnabledBody body) =>
{
  return new
  {
    name = body.toggle,
    enabled = unleash.GetVariants(body.toggle, body.context).First(),
    context = body.context
  };
});

app.Run("http://*:" + port);

class IsEnabledBody
{
  public string toggle { get; set; }
  public UnleashContext context { get; set; }
}