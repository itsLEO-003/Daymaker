class Product {

    static int count = 0;
    static int price = 100;

    int id = 10;
    String name = "Unknown";

    static {
        System.out.println("Static Block 1");
        count = 1;
    }

    static {
        System.out.println("Static Block 2");
        price = 500;
    }

    {
        System.out.println("Instance Block 1");
        id = 20;
    }

    {
        System.out.println("Instance Block 2");
        name = "Product";
    }

    Product() {
        System.out.println("Constructor 1");
    }

    Product(int id) {
        this.id = id;
        System.out.println("Constructor 2");
    }

    static void showCompanyData() {
        System.out.println("Count = " + count);
        System.out.println("Price = " + price);
    }

    void display() {
        System.out.println("ID = " + id);
        System.out.println("Name = " + name);
    }

    public static void main(String[] args) {

        showCompanyData();

        Product p1 = new Product();

        Product p2 = new Product(100);

        p1.display();
        p2.display();
    }