from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Configure database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'hospital.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    contact = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='Active')
    last_visit = db.Column(db.Date)
    
    def to_dict(self):
        return {
            'id': self.id,
            'patient_id': self.patient_id,
            'name': self.name,
            'age': self.age,
            'gender': self.gender,
            'contact': self.contact,
            'status': self.status,
            'last_visit': self.last_visit.strftime('%Y-%m-%d') if self.last_visit else None
        }

class Doctor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    specialization = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(20), nullable=False)
    experience = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), default='Active')
    
    def to_dict(self):
        return {
            'id': self.id,
            'doctor_id': self.doctor_id,
            'name': self.name,
            'specialization': self.specialization,
            'department': self.department,
            'contact': self.contact,
            'experience': self.experience,
            'status': self.status
        }

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.String(20), unique=True, nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.String(20), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Scheduled')
    
    patient = db.relationship('Patient', backref='appointments')
    doctor = db.relationship('Doctor', backref='appointments')
    
    def to_dict(self):
        return {
            'id': self.id,
            'appointment_id': self.appointment_id,
            'patient': self.patient.name if self.patient else None,
            'doctor': self.doctor.name if self.doctor else None,
            'date': self.date.strftime('%Y-%m-%d'),
            'time': self.time,
            'department': self.department,
            'status': self.status
        }

class Admission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admission_id = db.Column(db.String(20), unique=True, nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    room_number = db.Column(db.String(20), nullable=False)
    admission_date = db.Column(db.Date, nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    condition = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Stable')
    
    patient = db.relationship('Patient', backref='admissions')
    doctor = db.relationship('Doctor', backref='admissions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'admission_id': self.admission_id,
            'patient': self.patient.name if self.patient else None,
            'room_number': self.room_number,
            'admission_date': self.admission_date.strftime('%Y-%m-%d'),
            'doctor': self.doctor.name if self.doctor else None,
            'condition': self.condition,
            'status': self.status
        }

class Medicine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    medicine_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    supplier = db.Column(db.String(100), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'medicine_id': self.medicine_id,
            'name': self.name,
            'category': self.category,
            'stock': self.stock,
            'unit_price': self.unit_price,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d'),
            'supplier': self.supplier
        }

class Billing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.String(20), unique=True, nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctor.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='Pending')
    
    patient = db.relationship('Patient', backref='bills')
    doctor = db.relationship('Doctor', backref='bills')
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'patient': self.patient.name if self.patient else None,
            'doctor': self.doctor.name if self.doctor else None,
            'date': self.date.strftime('%Y-%m-%d'),
            'total_amount': self.total_amount,
            'status': self.status
        }

class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    reorder_level = db.Column(db.Integer, nullable=False)
    expiry_date = db.Column(db.Date)
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_id': self.item_id,
            'name': self.name,
            'category': self.category,
            'quantity': self.quantity,
            'unit': self.unit,
            'reorder_level': self.reorder_level,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d') if self.expiry_date else None
        }

# Create database tables
with app.app_context():
    db.create_all()

# Helper function to generate IDs
def generate_id(prefix):
    return f"{prefix}{datetime.now().strftime('%Y%m%d%H%M%S')}"

# API Routes

# Patients
@app.route('/api/patients', methods=['GET', 'POST'])
def patients():
    if request.method == 'GET':
        patients = Patient.query.all()
        return jsonify([patient.to_dict() for patient in patients])
    elif request.method == 'POST':
        data = request.json
        patient = Patient(
            patient_id=generate_id('P'),
            name=data['name'],
            age=data['age'],
            gender=data['gender'],
            contact=data['contact'],
            status=data.get('status', 'Active'),
            last_visit=datetime.strptime(data['last_visit'], '%Y-%m-%d').date() if 'last_visit' in data else None
        )
        db.session.add(patient)
        db.session.commit()
        return jsonify(patient.to_dict()), 201

@app.route('/api/patients/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def patient(id):
    patient = Patient.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(patient.to_dict())
    elif request.method == 'PUT':
        data = request.json
        patient.name = data.get('name', patient.name)
        patient.age = data.get('age', patient.age)
        patient.gender = data.get('gender', patient.gender)
        patient.contact = data.get('contact', patient.contact)
        patient.status = data.get('status', patient.status)
        if 'last_visit' in data:
            patient.last_visit = datetime.strptime(data['last_visit'], '%Y-%m-%d').date()
        db.session.commit()
        return jsonify(patient.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(patient)
        db.session.commit()
        return '', 204

# Doctors
@app.route('/api/doctors', methods=['GET', 'POST'])
def doctors():
    if request.method == 'GET':
        doctors = Doctor.query.all()
        return jsonify([doctor.to_dict() for doctor in doctors])
    elif request.method == 'POST':
        data = request.json
        doctor = Doctor(
            doctor_id=generate_id('D'),
            name=data['name'],
            specialization=data['specialization'],
            department=data['department'],
            contact=data['contact'],
            experience=data['experience'],
            status=data.get('status', 'Active')
        )
        db.session.add(doctor)
        db.session.commit()
        return jsonify(doctor.to_dict()), 201

@app.route('/api/doctors/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def doctor(id):
    doctor = Doctor.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(doctor.to_dict())
    elif request.method == 'PUT':
        data = request.json
        doctor.name = data.get('name', doctor.name)
        doctor.specialization = data.get('specialization', doctor.specialization)
        doctor.department = data.get('department', doctor.department)
        doctor.contact = data.get('contact', doctor.contact)
        doctor.experience = data.get('experience', doctor.experience)
        doctor.status = data.get('status', doctor.status)
        db.session.commit()
        return jsonify(doctor.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(doctor)
        db.session.commit()
        return '', 204

# Appointments
@app.route('/api/appointments', methods=['GET', 'POST'])
def appointments():
    if request.method == 'GET':
        appointments = Appointment.query.all()
        return jsonify([appointment.to_dict() for appointment in appointments])
    elif request.method == 'POST':
        data = request.json
        appointment = Appointment(
            appointment_id=generate_id('A'),
            patient_id=data['patient_id'],
            doctor_id=data['doctor_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=data['time'],
            department=data['department'],
            status=data.get('status', 'Scheduled')
        )
        db.session.add(appointment)
        db.session.commit()
        return jsonify(appointment.to_dict()), 201

@app.route('/api/appointments/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def appointment(id):
    appointment = Appointment.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(appointment.to_dict())
    elif request.method == 'PUT':
        data = request.json
        appointment.patient_id = data.get('patient_id', appointment.patient_id)
        appointment.doctor_id = data.get('doctor_id', appointment.doctor_id)
        if 'date' in data:
            appointment.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        appointment.time = data.get('time', appointment.time)
        appointment.department = data.get('department', appointment.department)
        appointment.status = data.get('status', appointment.status)
        db.session.commit()
        return jsonify(appointment.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(appointment)
        db.session.commit()
        return '', 204

# Admissions
@app.route('/api/admissions', methods=['GET', 'POST'])
def admissions():
    if request.method == 'GET':
        admissions = Admission.query.all()
        return jsonify([admission.to_dict() for admission in admissions])
    elif request.method == 'POST':
        data = request.json
        admission = Admission(
            admission_id=generate_id('AD'),
            patient_id=data['patient_id'],
            room_number=data['room_number'],
            admission_date=datetime.strptime(data['admission_date'], '%Y-%m-%d').date(),
            doctor_id=data['doctor_id'],
            condition=data['condition'],
            status=data.get('status', 'Stable')
        )
        db.session.add(admission)
        db.session.commit()
        return jsonify(admission.to_dict()), 201

@app.route('/api/admissions/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def admission(id):
    admission = Admission.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(admission.to_dict())
    elif request.method == 'PUT':
        data = request.json
        admission.patient_id = data.get('patient_id', admission.patient_id)
        admission.room_number = data.get('room_number', admission.room_number)
        if 'admission_date' in data:
            admission.admission_date = datetime.strptime(data['admission_date'], '%Y-%m-%d').date()
        admission.doctor_id = data.get('doctor_id', admission.doctor_id)
        admission.condition = data.get('condition', admission.condition)
        admission.status = data.get('status', admission.status)
        db.session.commit()
        return jsonify(admission.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(admission)
        db.session.commit()
        return '', 204

# Pharmacy (Medicines)
@app.route('/api/medicines', methods=['GET', 'POST'])
def medicines():
    if request.method == 'GET':
        medicines = Medicine.query.all()
        return jsonify([medicine.to_dict() for medicine in medicines])
    elif request.method == 'POST':
        data = request.json
        medicine = Medicine(
            medicine_id=generate_id('M'),
            name=data['name'],
            category=data['category'],
            stock=data['stock'],
            unit_price=data['unit_price'],
            expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%d').date(),
            supplier=data['supplier']
        )
        db.session.add(medicine)
        db.session.commit()
        return jsonify(medicine.to_dict()), 201

@app.route('/api/medicines/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def medicine(id):
    medicine = Medicine.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(medicine.to_dict())
    elif request.method == 'PUT':
        data = request.json
        medicine.name = data.get('name', medicine.name)
        medicine.category = data.get('category', medicine.category)
        medicine.stock = data.get('stock', medicine.stock)
        medicine.unit_price = data.get('unit_price', medicine.unit_price)
        if 'expiry_date' in data:
            medicine.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        medicine.supplier = data.get('supplier', medicine.supplier)
        db.session.commit()
        return jsonify(medicine.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(medicine)
        db.session.commit()
        return '', 204

# Billing
@app.route('/api/billing', methods=['GET', 'POST'])
def billing():
    if request.method == 'GET':
        bills = Billing.query.all()
        return jsonify([bill.to_dict() for bill in bills])
    elif request.method == 'POST':
        data = request.json
        bill = Billing(
            invoice_id=generate_id('INV'),
            patient_id=data['patient_id'],
            doctor_id=data['doctor_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            total_amount=data['total_amount'],
            status=data.get('status', 'Pending')
        )
        db.session.add(bill)
        db.session.commit()
        return jsonify(bill.to_dict()), 201

@app.route('/api/billing/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def bill(id):
    bill = Billing.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(bill.to_dict())
    elif request.method == 'PUT':
        data = request.json
        bill.patient_id = data.get('patient_id', bill.patient_id)
        bill.doctor_id = data.get('doctor_id', bill.doctor_id)
        if 'date' in data:
            bill.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        bill.total_amount = data.get('total_amount', bill.total_amount)
        bill.status = data.get('status', bill.status)
        db.session.commit()
        return jsonify(bill.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(bill)
        db.session.commit()
        return '', 204

# Inventory
@app.route('/api/inventory', methods=['GET', 'POST'])
def inventory():
    if request.method == 'GET':
        items = Inventory.query.all()
        return jsonify([item.to_dict() for item in items])
    elif request.method == 'POST':
        data = request.json
        item = Inventory(
            item_id=generate_id('INV'),
            name=data['name'],
            category=data['category'],
            quantity=data['quantity'],
            unit=data['unit'],
            reorder_level=data['reorder_level'],
            expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%d').date() if 'expiry_date' in data else None
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201

@app.route('/api/inventory/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def inventory_item(id):
    item = Inventory.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(item.to_dict())
    elif request.method == 'PUT':
        data = request.json
        item.name = data.get('name', item.name)
        item.category = data.get('category', item.category)
        item.quantity = data.get('quantity', item.quantity)
        item.unit = data.get('unit', item.unit)
        item.reorder_level = data.get('reorder_level', item.reorder_level)
        if 'expiry_date' in data:
            item.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        db.session.commit()
        return jsonify(item.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return '', 204

# Dashboard Stats
@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    stats = {
        'total_patients': Patient.query.count(),
        'active_doctors': Doctor.query.filter_by(status='Active').count(),
        'occupied_beds': Admission.query.filter(Admission.status != 'Discharged').count(),
        'critical_cases': Admission.query.filter_by(status='Critical').count(),
        'todays_appointments': Appointment.query.filter_by(date=datetime.now().date()).count(),
        'monthly_revenue': db.session.query(db.func.sum(Billing.total_amount))
                        .filter(db.extract('month', Billing.date) == datetime.now().month)
                        .scalar() or 0
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)