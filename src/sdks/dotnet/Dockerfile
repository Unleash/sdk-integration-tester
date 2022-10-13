FROM mcr.microsoft.com/dotnet/sdk:6.0-alpine AS build
WORKDIR /app

# Copy everything
COPY . .
# Restore as distinct layers
RUN dotnet restore
# Build and publish a release
RUN dotnet publish -o sdk-integration-tester -c Release

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:6.0-alpine as runtime
WORKDIR /app
COPY --from=build /app/sdk-integration-tester .
ENTRYPOINT ["dotnet", "dotnet.dll"]