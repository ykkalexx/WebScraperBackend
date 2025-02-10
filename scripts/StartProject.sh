echo "Starting Development Server..."

cd ./Server
npm run dev

echo"Starting Client..."

cd ../Client
npm run dev

echo "Server is running on http://localhost:3000"
echo "For documentation, visit http://localhost:3000/api-docs"