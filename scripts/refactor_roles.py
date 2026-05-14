import pathlib

p = pathlib.Path('orders/views.py')
text = p.read_text()

# Replace permission checker calls
text = text.replace('is_owner_or_admin', 'is_staff')

# Replace role lists in validation
text = text.replace("'owner', 'admin'", "'admin'")
text = text.replace("'customer', 'owner', 'admin'", "'user', 'admin'")
text = text.replace("['customer', 'owner', 'admin']", "['user', 'admin']")

# Replace comments
text = text.replace('owners/admins', 'admins')
text = text.replace('owners or admins', 'admins')
text = text.replace('customers see', 'users see')
text = text.replace('Customers can only', 'Users can only')

# Replace 'customer' role string with 'user' (but not the Customer model/class references)
# Be careful: only replace role-related 'customer' strings
lines = text.split('\n')
new_lines = []
for line in lines:
    # Skip lines with Customer class/serializer references
    if 'class Customer' in line or 'CustomerSerializer' in line or 'Customer.objects' in line or 'customer_profile' in line or 'customer_name' in line or 'customer_email' in line or 'customer_phone' in line:
        new_lines.append(line)
        continue
    # Replace role-related customer with user
    line = line.replace("role = 'customer'", "role = 'user'")
    line = line.replace("get_role(request.user) == 'customer'", "get_role(request.user) == 'user'")
    line = line.replace("get_role(user) == 'customer'", "get_role(user) == 'user'")
    line = line.replace("if role == 'customer':", "if role == 'user':")
    line = line.replace("role in ['customer'", "role in ['user'")
    line = line.replace("role == 'customer'", "role == 'user'")
    new_lines.append(line)

text = '\n'.join(new_lines)
p.write_text(text)
print('Done replacing in views.py')

# Now fix serializers.py
p2 = pathlib.Path('orders/serializers.py')
text2 = p2.read_text()
text2 = text2.replace("'customer', 'owner', 'admin'", "'user', 'admin'")
# Keep CustomerSerializer class name and Customer model references
p2.write_text(text2)
print('Done replacing in serializers.py')