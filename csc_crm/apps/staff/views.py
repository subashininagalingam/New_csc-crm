from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from django.db.models.functions import TruncMonth
from django.db.models import Q, Sum, Avg, Count
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from datetime import datetime
from datetime import timedelta
from datetime import datetime, time
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from openpyxl import Workbook
import csv
import re
from csc_crm.apps.leads.models import *
from .models import *
from .forms import *


# ============================ LIST-VIEW ============================= 


def staff_management(request):
    """Display all staff members with filters and role permissions matrix"""

    queryset = Staff.objects.select_related('role', 'department').order_by('-created_at')

    # Apply filters
    department = request.GET.get('department')
    role = request.GET.get('role')
    status = request.GET.get('status')
    search = request.GET.get('search', '').strip()

    if department:
        queryset = queryset.filter(department_id=department)

    if role:
        queryset = queryset.filter(role_id = role)
    
    if status:
        queryset = queryset.filter(status = status)

    if search:
        queryset = queryset.filter(
            Q(first_name__icontains = search) |
            Q(last_name__icontains = search) |
            Q(email__icontains = search) |
            Q(employee_id__icontains = search)
        )
    # Pagination
    paginator = Paginator(queryset, 15)
    page_number = request.GET.get('page')
    staff_list = paginator.get_page(page_number)

    # Get all roles and departments for filters
    all_roles = StaffRole.objects.all()
    all_departments = Department.objects.all()

    # Role permission Matrix data
    permissions_matrix = [
        {
            'module':'Leads',
            'permission':{
                'admin': 'All',
                'manager': 'All',
                'sales_exec': 'Own',
                'telecaller': 'Own',
                'support': 'View',
                'hr': 'View',
                'trainer': 'View'
            }
        },
        {
            'module': 'Staff',
            'permission':{
                'admin':'All',
                'manager':'View',
                'sales_exec': 'None',
                'telecaller': 'None',
                'support': 'None',
                'hr': 'All',
                'trainer': 'None'
            }
        },
        {
            'module': 'Reports',
            'permission':{
                'admin':'All',
                'manager':'Team',
                'sales_exec':'Own',
                'telecaller': 'None',
                'support': 'None',
                'hr': 'HR',
                'trainer': 'None'
            }
        },
        {
            'module': 'Attendance',
            'permission': {
                'admin': 'All',
                'manager': 'View',
                'sales_exec':'Own',
                'telecaller':  'Own',
                'support': 'Own',
                'hr': 'All',
                'trainer': 'Own'
            }
        }
    ]

    # Filter form
    filter_form = StaffFilterForm(request.GET)

    context = {
        'page_title': 'Staff Management',
        'staff_list': staff_list,
        'filter_form': filter_form,
        'total_staff': queryset.count(),
        'roles': all_roles,
        'departments': all_departments,
        'permissions_matrix': permissions_matrix,
        'paginator': paginator,
        'page_obj': staff_list,
        'is_paginated': staff_list.has_other_pages(),
        'page_obj_number': staff_list.number,
        'search_query': search,
    }
    return render(request, 'staff/management.html', context)

# ========================== AUTO GENERATE EMP ID ==========================

def generate_employee_id():
    staff_ids = Staff.objects.values_list('employee_id', flat=True)

    max_number = 0

    for employee_id in staff_ids:
        match = re.match(r'^EMP(\d+)$', employee_id)

        if match:
            number = int(match.group(1))

            if number > max_number:
                max_number = number

    return f"EMP{max_number + 1:03d}"

# ========================== CREATE NEW STAFF ==============================

def add_staff(request):
    """Add new staff member"""

    if request.method == 'POST':
        form = StaffForm(request.POST, request.FILES)
    
        if form.is_valid():
            documents = request.FILES.getlist('documents')

            if not documents:
                form.add_error(None, 'At least one document is required.')

                return render(request, 'staff/add_staff.html', {
                    'page_title': 'Add New Staff',
                    'form': form
                })

            staff = form.save()

            for document in documents:
                StaffDocument.objects.create(
                    staff=staff,
                    document=document
                )

            messages.success(
                request,
                f"Staff member '{staff.full_name()}' added successfully!"
            )

            return redirect('overview', staff_id=staff.id)
        else:
            print(form.errors)
    else:
        form = StaffForm(
            initial={
                'employee_id': generate_employee_id()
            }
        )

    context = {
        'page_title': 'Add New Staff',
        'form': form
    }

    return render(request, 'staff/add_staff.html', context)

# ============================= CHECK EMAIL EXISTING (FOR VALIDATION) ===============================

def check_email(request):

    email = request.GET.get('email')
    staff_id = request.GET.get('staff_id')

    email_exists = Staff.objects.filter(
        email=email
    ).exclude(
        id=staff_id
    ).exists()

    return JsonResponse({
        'exists': email_exists
    })

# ======================= CHECK PHONE NO EXISTING (FOR VALIDATION) ====================

def check_phone(request):

    phone = request.GET.get('phone','').strip()
    staff_id = request.GET.get('staff_id')

    phone_exists = Staff.objects.filter(
        phone = phone
    ).exclude(
        id=staff_id
    ).exists()

    return JsonResponse({
        'exists':phone_exists
    })

# ========================== UPDATING STAFF ===================================

def edit_staff(request, id):
    """Update existing staff"""

    staff = get_object_or_404(Staff, id=id)

    if request.method == 'POST':
        form = EditStaffForm(request.POST, request.FILES, instance=staff)
        if form.is_valid():
            form.save()
            messages.success(request, f"Staff member '{staff.full_name()}' Updated sucessfully!")
        
            return redirect('overview', staff_id=staff.id)
        else:
            print(form.errors)
    else:
        form = StaffForm(instance=staff)

    context = {
        'page_title':f"Edit '{staff.full_name}'",
        'form':form,
        'staff':staff
    }

    return render(request, 'staff/edit_staff.html', context)

# ============================= STAFF DELETE ==================================

def delete_staff(request, id):
    """Deleting staff member"""

    staff = get_object_or_404(Staff, id=id)

    if request.method == 'POST':
        staff.status = 'terminated'
        staff.save()
        messages.success(request, f"Staff member '{staff.full_name()}' terminated!")
        next_url = request.POST.get('next')

        if next_url:
            return redirect(next_url)

        return redirect('staff_management')
        
    context = {
        'page_title': 'Delete Staff',
        'staff': staff,
        'next_url': request.GET.get('next', ''),
    }

    return render(request, 'staff/confirm_delete.html', context)

# =========================== QUICK EDIT/AJAX ===================================

def quick_edit_staff(request, id):
    """Quick edit via AJAX"""

    staff = get_object_or_404(Staff, id=id)

    if request.method == 'POST':
        form = StaffQuickEditForm(request.POST, instance=staff)
        if form.is_valid():
            form.save()

            # Check if it's an AJAX request
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Updated Successfully'
                })
            else:
                messages.success(request, f"Staff '{staff.full_name}' updated successfully!")
        else:
            # Return JSON error response for AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors
                })
    else:
        form = StaffQuickEditForm(instance=staff)

    context = {
        'page_title': f'Quick Edit - {staff.full_name}',
        'form': form,
        'staff': staff
    }

    return render(request, 'staff/quick_edit.html', context)

# ============================ EXPORT - STAFF LIST TO CSV ===============================

def export_staff(request):
    """Export staff list as CSV"""

    response = HttpResponse(content_type ='text/csv')
    response['Content-Disposition'] = 'attachement; filename="staff_list.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department',
        'Status', 'Monthly Target', 'Performance Rating', 'Date of Joining'
    ])

    # Get all staff
    staff_list = Staff.objects.select_related('role', 'department').all()

    department = request.GET.get('department')
    role = request.GET.get('role')
    search = request.GET.get('search', '').strip()

    if department:
        staff_list = staff_list.filter(
            department_id=department
        )

    if role:
        staff_list = staff_list.filter(
            role_id=role
        )

    if search:
        staff_list = staff_list.filter(
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(email__icontains=search) |
            Q(employee_id__icontains=search)
        )

    for staff in staff_list:
        writer.writerow([
            staff.employee_id,
            staff.full_name(),
            staff.email,
            staff.phone,
            staff.role.get_role_name_display(),
            staff.department.get_dept_name_display(),
            staff.get_status_display(),
            staff.monthly_target,
            staff.performance_rating,
            staff.date_of_joining.strftime('%d-%m-%Y'),
        ])

    return response

# ================================================ STAFF OVERVIEW ====================================================
# ============================== DASHBOARD ==============================

def overview(request, staff_id=None):

    # ======= STAFF =======
    if staff_id:
        staff = get_object_or_404(Staff, id=staff_id)
    else:
        staff = Staff.objects.filter(status="active").first()

    if not staff:
        return render(request, "staff/overview.html", {
            "error": "No staff found"
        })

    # ======= TRAINER SCHEDULE =======
    if request.method == "POST":
        date = request.POST.get("date")
        time = request.POST.get("time")
        type_value = request.POST.get("type")
        topic = request.POST.get("topic")
        status = request.POST.get("status", "upcoming")

        if all([date, time, type_value, topic]):
            TrainerSchedule.objects.create(
                staff=staff,
                date=date,
                time=time,
                type=type_value,
                topic=topic,
                status=status
            )

    # ======= LEADS =======
    leads = Lead.objects.filter(staff=staff)

    assigned_leads = leads.filter(status="assigned").count()
    converted_leads = leads.filter(status="converted").count()
    pending_leads = leads.filter(
        status__in=["new", "assigned", "in_progress"]
    ).count()

    recent_leads = leads.order_by("-created_at")[:10]

    # ======= REVENUE =======
    revenue_qs = Revenue.objects.filter(staff=staff)

    total_revenue = revenue_qs.aggregate(
        total=Sum("amount")
    )["total"] or 0

    now = timezone.now()

    this_month_revenue = revenue_qs.filter(
        created_at__year=now.year,
        created_at__month=now.month
    ).aggregate(total=Sum("amount"))["total"] or 0

    # Previous Month
    if now.month == 1:
        last_month = 12
        last_year = now.year - 1
    else:
        last_month = now.month - 1
        last_year = now.year

    last_month_revenue = revenue_qs.filter(
        created_at__year=last_year,
        created_at__month=last_month
    ).aggregate(total=Sum("amount"))["total"] or 0

    # ======= WEEKLY GRAPH =======
    week_data_this = []
    week_data_last = []

    start_of_month = now.replace(day=1)

    for week in range(5):

        start = start_of_month + timedelta(days=week * 7)
        end = start + timedelta(days=6)

        current_revenue = revenue_qs.filter(
            created_at__date__range=(start.date(), end.date())
        ).aggregate(total=Sum("amount"))["total"] or 0

        previous_revenue = revenue_qs.filter(
            created_at__date__range=(
                (start.replace(year=last_year)).date(),
                (end.replace(year=last_year)).date()
            )
        ).aggregate(total=Sum("amount"))["total"] or 0

        week_data_this.append(float(current_revenue))
        week_data_last.append(float(previous_revenue))

    # ======= TARGET PROGRESS =======
    target_amount = staff.monthly_target or 0

    # Monthly target => this month revenue
    completed_amount = this_month_revenue

    if target_amount > 0:
        progress_percentage = round(
            (completed_amount / target_amount) * 100
        )
    else:
        progress_percentage = 0

    progress_percentage = min(progress_percentage, 100)

    # ======= ATTENDANCE =======
    today = timezone.now().date()

    today_attendance = Attendance.objects.filter(
        staff=staff,
        date=today
    ).order_by("-id").first()

    today_status = (
        today_attendance.status
        if today_attendance
        else "Absent"
    )

    # ======= TRAINER SCHEDULES =======
    schedules = TrainerSchedule.objects.filter(
        staff=staff
    ).order_by("-date", "-time")

    # ======= CONTEXT =======
    context = {
        "staff": staff,
        "assigned_leads": assigned_leads,
        "converted_leads": converted_leads,
        "pending_leads": pending_leads,
        "recent_leads": recent_leads,
        "total_revenue": total_revenue,
        "this_month_revenue": this_month_revenue,
        "last_month_revenue": last_month_revenue,
        "week_data_this": week_data_this,
        "week_data_last": week_data_last,
        "completed_amount": completed_amount,
        "progress_percentage": progress_percentage,
        "today_attendance": today_attendance,
        "today_status": today_status,
        "schedules": schedules,
    }

    return render(request, "staff/overview.html", context)

# ============================== EXPORT OVERVIEW CSV ==============================


import csv
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

def staff_export(request, id):

    staff = get_object_or_404(Staff, id=id)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = (
        f'attachment; filename="{staff.employee_id}_report.csv"'
    )

    writer = csv.writer(response)

    
    # STAFF DETAILS
   
    writer.writerow(['STAFF DETAILS'])

    writer.writerow([
        'Employee ID',
        'Name',
        'Email',
        'Phone',
        'Role',
        'Department',
        'Status',
        'Monthly Target',
        'Performance Rating',
        'Date Of Joining'
    ])

    writer.writerow([
        staff.employee_id,
        staff.full_name(),
        staff.email,
        staff.phone,
        staff.role.get_role_name_display(),
        staff.department.get_dept_name_display(),
        staff.get_status_display(),
        staff.monthly_target,
        staff.performance_rating,
        staff.date_of_joining.strftime('%d-%m-%Y')
        if staff.date_of_joining else ''
    ])

    writer.writerow([])

    role_name = staff.role.role_name

    
    # SALES EXECUTIVE & TELECALLER
   
    if role_name in ['sales_executive', 'telecaller']:

        leads = Lead.objects.filter(staff=staff)

        writer.writerow(['LEADS DATA'])

        writer.writerow([
            'Lead Name',
            'Phone',
            'Email',
            'Status',
            'Created At'
        ])

        for lead in leads:
            writer.writerow([
                lead.name,
                lead.phone,
                lead.email or '',
                lead.get_status_display(),
                lead.created_at.strftime('%d-%m-%Y %H:%M')
            ])

    
    # TRAINER
   
    elif role_name == 'trainer':

        schedules = TrainerSchedule.objects.filter(
            staff=staff
        ).order_by('-date', '-time')

        writer.writerow(['TRAINING SCHEDULE'])

        writer.writerow([
            'Date',
            'Time',
            'Class / Meeting',
            'Topic',
            'Status'
        ])

        for schedule in schedules:
            writer.writerow([
                schedule.date.strftime('%d-%m-%Y'),
                schedule.time.strftime('%I:%M %p'),
                schedule.get_type_display(),
                schedule.topic,
                schedule.get_status_display(),
            ])

    return response
    
#============================================================Attendance page=======================================================================   
from django.utils import timezone
from datetime import datetime, time

def auto_checkout_pending_attendance():

    current_time = timezone.localtime()

    if current_time.time() < time(19, 00):
        return

    

    pending_attendance = Attendance.objects.filter(
        log_in__isnull=False,
        log_out__isnull=True
    )

    for attendance in pending_attendance:

        auto_logout_time = timezone.make_aware(
            datetime.combine(
                attendance.date,
                time(18, 30)
            )
        )

        attendance.log_out = auto_logout_time

        worked_time = (
            attendance.log_out -
            attendance.log_in
        )

        worked_hours = (
            worked_time.total_seconds() / 3600
        )

        if worked_hours < 4:
            attendance.status = 'Absent'

        attendance.save()
#======attendance=========
def attendance_page(request, id):

    auto_checkout_pending_attendance()
    staff = get_object_or_404(Staff, id=id)
    
    if staff.role.role_name == "Admin":
        messages.error(request, "Attendance is not applicable for Admin.")
        return redirect("overview", staff_id=staff.id)  
    # ================= TODAY =================
    today = timezone.localdate()

    today_attendance = Attendance.objects.filter(staff=staff,date=today ).first()

    today_status = today_attendance.status if today_attendance else 'Absent'
    
    show_checkout = False

    if (
       today_attendance and
       today_attendance.log_in and
       not today_attendance.log_out):

       show_checkout = True
    # ================= HISTORY =================
    attendance_data = Attendance.objects.filter( staff=staff).order_by('-date')

    filter_date = request.GET.get('date')
    month = request.GET.get('month')
    year = request.GET.get('year')

    if filter_date:
        attendance_data = attendance_data.filter(date=filter_date)

    if month:
        attendance_data = attendance_data.filter(date__month=month)

    if year:
        attendance_data = attendance_data.filter(date__year=year)

    # ================= COUNTS =================
    total_working_days = attendance_data.count()
    present_days = attendance_data.filter(status__in=['Present', 'Late']).count()
    absent_days = attendance_data.filter(status='Absent').count()
    leave_days = attendance_data.filter(status='Leave').count()
    late_days = attendance_data.filter(status='Late').count()

    attendance_score = (attendance_data.filter(status='Present').count() +(late_days * 0.5))

    if total_working_days > 0:
        attendance_percentage = int(attendance_score / total_working_days * 100)
    else:
        attendance_percentage = 0

    # ================= CONTEXT =================
    context = {
        'attendance_data': attendance_data,
        'total_working_days': total_working_days,
        'present_days': present_days,
        'absent_days': absent_days,
        'leave_days': leave_days,
        'late_days': late_days,
        'attendance_percentage': attendance_percentage,
        'today_status': today_status,
        'today_attendance': today_attendance,
        'show_checkout': show_checkout,
        'staff': staff,
    }

    return render(request, 'staff/attendance.html', context)


#================export atttendance btn===============

def export_attendance(request, id):

    staff = get_object_or_404(Staff, id=id)

    attendance_data = Attendance.objects.filter(staff=staff)

    filter_date = request.GET.get('date')
    month = request.GET.get('month')
    year = request.GET.get('year')

    if filter_date:
        attendance_data = attendance_data.filter(date=filter_date)

    if month:
        attendance_data = attendance_data.filter(date__month=month)

    if year:
        attendance_data = attendance_data.filter(date__year=year)

    attendance_data = attendance_data.order_by('-date')

    wb = Workbook()
    ws = wb.active
    ws.title = "Attendance"

    ws.append(["Date", "Log In", "Log Out", "Status", "Hours"])

    for a in attendance_data:
        ws.append([
            str(a.date),
            a.log_in.strftime("%I:%M %p") if a.log_in else "--",
            a.log_out.strftime("%I:%M %p") if a.log_out else "--",
            a.status,
            str(a.total_hours) if a.total_hours else "--"
        ])

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    response['Content-Disposition'] = f'attachment; filename=attendance_{staff.employee_id}.xlsx'

    wb.save(response)

    return response
#==================================================================staff-checkin page===============================================
def staff_checkin(request, id):

    auto_checkout_pending_attendance()

    staff = Staff.objects.get(id=id)
    today = timezone.localdate()
    
    current_time = timezone.localtime(timezone.now())

    is_checkout_closed = current_time.time() >= time(19, 00)

    # ================= TODAY ATTENDANCE =================
    today_attendance = Attendance.objects.filter(staff=staff, date=today).first()

    # ===== SMART FLAGS =====
    is_checkin_done = False
    is_checkout_done = False
    is_leave_or_absent = False

    if today_attendance:

        if today_attendance.log_in:
            is_checkin_done = True

        if today_attendance.log_out:
            is_checkout_done = True

        if today_attendance.status in ['Leave', 'Absent']:
            is_leave_or_absent = True

    # ================= POST =================
    if request.method == 'POST':
        
        # Future Joining Date Validation
        if staff.date_of_joining > today:
            messages.error(
            request,
            "Attendance cannot be marked before joining date.")
            return redirect('attendance', id=staff.id)

        # Admin Validation
        if staff.role.role_name == "Admin":
            messages.error(
            request,
            "Attendance is not applicable for Admin." )
            return redirect('attendance', id=staff.id)
    
        action = request.POST.get('action')
        current_time = timezone.localtime(timezone.now())

        attendance = Attendance.objects.filter(
            staff=staff,
            date=today
        ).first()

        if not attendance:
            attendance = Attendance(staff=staff, date=today)

        # -------- CHECKIN --------
        if action == 'checkin':
            if current_time.time() >= time(19, 00):
                messages.error(
                request,"Check-In is not allowed after 7:00 PM.")
                return redirect("attendance", id=staff.id)
            
            if not attendance.log_in:
                attendance.log_in = current_time

                office_time = datetime.strptime("09:15", "%H:%M").time()

                if current_time.time() > office_time:
                    attendance.status = 'Late'
                else:
                    attendance.status = 'Present'

                attendance.save()
                messages.success(request, "Check-In completed successfully.")

        # -------- CHECKOUT --------
        elif action == 'checkout':

            if current_time.time() >= time(19, 00):

                messages.error(
                request,
                "Checkout is allowed only until 7:00 PM." )

            elif attendance.log_in:

                attendance.log_out = current_time

                worked_time = attendance.log_out - attendance.log_in

                worked_hours = worked_time.total_seconds() / 3600

                if worked_hours < 4:

                    attendance.status = 'Absent'

                attendance.save()

                messages.success(request,"Check-Out completed successfully.")
        # -------- LEAVE --------
        elif action == 'leave':
            attendance.status = 'Leave'
            attendance.log_in = None
            attendance.log_out = None
            attendance.total_hours = None
            attendance.save()
            messages.success(request, "Leave marked successfully.")

        # -------- ABSENT --------
        elif action == 'absent':
            attendance.status = 'Absent'
            attendance.log_in = None
            attendance.log_out = None
            attendance.total_hours = None
            attendance.save()
            messages.success(request, "Absent marked successfully.")

        return redirect('attendance', id=staff.id)

    return render(request, 'staff/staff_checkin.html', {
        'active_attendance': Attendance.objects.filter(
            staff=staff,
            log_in__isnull=False,
            log_out__isnull=True
        ).order_by('-id').first(),
        'staff': staff,

        #  IMPORTANT FLAGS
        'is_checkin_done': is_checkin_done,
        'is_checkout_done': is_checkout_done,
        'is_leave_or_absent': is_leave_or_absent,

        'is_checkout_closed': is_checkout_closed,
    })

#======================================== DOCUMENT =========================================
# ================================ DOCUMENT VIEWS ================================

def _detect_document_type(filename):
    """Auto-detect document type from filename keywords."""
    import os
    name = os.path.splitext(filename)[0].lower()
    if any(k in name for k in ['aadhaar', 'aadhar', 'uid']):
        return 'aadhaar', 'Aadhaar Card'
    if any(k in name for k in ['pan', 'pancard']):
        return 'pan', 'PAN Card'
    if 'passport' in name:
        return 'other', 'Passport'
    if any(k in name for k in ['resume', 'cv']):
        return 'resume', 'Resume'
    if any(k in name for k in ['offer', 'appointment']):
        return 'offer_letter', 'Offer Letter'
    if any(k in name for k in ['certificate', 'cert', 'degree', 'diploma']):
        return 'certificate', 'Certificate'
    return 'other', os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ').title()


def _ensure_legacy_document(staff):
    """If staff has a legacy documents field file, create a StaffDocument entry for it."""
    import os
    if not staff.documents:
        return
    # Check if already imported
    existing = StaffDocument.objects.filter(staff=staff, document=staff.documents.name)
    if existing.exists():
        return
    filename = os.path.basename(staff.documents.name)
    doc_type, doc_name = _detect_document_type(filename)
    StaffDocument.objects.create(
        staff=staff,
        document_name=doc_name,
        document_type=doc_type,
        document=staff.documents.name,
        status='pending',
    )


def staff_documents(request, staff_id):
    """View documents for a specific staff member"""
    staff = get_object_or_404(Staff, id=staff_id)

    documents = StaffDocument.objects.filter(staff=staff).order_by('-uploaded_at')

    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')

        if uploaded_file:
            StaffDocument.objects.create(
                staff=staff,
                document=uploaded_file
            )

            messages.success(request, f"Document '{uploaded_file.name}' uploaded successfully!")
            return redirect('staff_documents', staff_id=staff.id)

        else:
            messages.error(request, 'Please select a file to upload.')

    context = {
        'staff': staff,
        'documents': documents,
        'total_count': documents.count(),
    }

    return render(request, 'staff/documents.html', context)

def delete_document(request, doc_id):
    """Delete a staff document"""
    import os

    doc = get_object_or_404(StaffDocument, id=doc_id)
    staff_id = doc.staff.id

    # Get file name before deleting
    document_display_name = os.path.basename(doc.document.name) if doc.document else "Document"

    if request.method == 'POST':
        if doc.document:
            doc.document.delete(save=False)

        doc.delete()
        messages.success(request, f"Document '{document_display_name}' deleted.")

    return redirect('staff_documents', staff_id=staff_id)


def update_document_status(request, doc_id):
    """Update document verification status"""
    doc = get_object_or_404(StaffDocument, id=doc_id)
    if request.method == 'POST':
        new_status = request.POST.get('status')
        if new_status in ['pending', 'verified', 'rejected']:
            doc.status = new_status
            doc.save()
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'status': new_status})
    return redirect('staff_documents', staff_id=doc.staff.id)
# ================================ Dashboard View ===================================

def staff_dashboard(request):
    
    total_staff = Staff.objects.count()

    active_staff = Staff.objects.filter(status = 'active').count()

    on_leave = Staff.objects.filter(status = 'on_leave').count()

    terminate = Staff.objects.filter(status = 'terminated').count()

    inactive = Staff.objects.filter(status = 'inactive').count()

    recent_staff = Staff.objects.order_by('-created_at')[:5]

    average_rating = round(Staff.objects.aggregate(Avg('performance_rating'))['performance_rating__avg'] or 0,2)

    today = timezone.localdate()

    present = Attendance.objects.filter(date = today, status = 'Present').count()

    late = Attendance.objects.filter(date = today, status = 'Late').count()

    absent = Attendance.objects.filter(date = today, status = 'Absent').count()

    leave = Attendance.objects.filter(date = today, status = 'Leave').count()

    departments = Department.objects.annotate(total_staff = Count('staff_members')).order_by('dept_name')

    total_attendance = present + late + absent + leave

    if total_attendance > 0:
        attendance_percentage = round(((present + late) / active_staff) * 100, 1)
    else:
        attendance_percentage = 0

    staff_status = {    
        'Active' : active_staff,
        'On Leave' : on_leave,
        'Inactive' : inactive,
        'Terminated' : terminate,
    }

    roles = (StaffRole.objects.annotate(total_staff = Count('staff_members')))

# ================================ Lead Dashboard ===================================

    total_leads = LeadCapture.objects.count()

    new_leads = LeadCapture.objects.filter(initial_status = 'new').count()

    contacted_leads = LeadCapture.objects.filter(initial_status = 'contacted').count()

    interested_leads = LeadCapture.objects.filter(initial_status = 'interested').count()

    demo_leads = LeadCapture.objects.filter(initial_status = 'demo_scheduled').count()

    enrolled_leads = LeadCapture.objects.filter(initial_status = 'enrolled').count()

    lost_leads = LeadCapture.objects.filter(initial_status = 'lost').count()

# ================================ 
# CONVERSION RATE 
# ================================

    if total_leads > 0:
        conversion_rate = round(
            (enrolled_leads / total_leads) * 100,
            1
        )
    else:
        conversion_rate = 0

    # =====================================================
    # Recent Leads
    # =====================================================

    recent_leads = LeadCapture.objects.select_related('assigned_to').order_by('created_at')[:5]

    # =====================================================
    # Today's Follow-ups
    # =====================================================

    today_followups = LeadCapture.objects.filter(
        next_followup_date=today
    ).exclude(
        initial_status__in=['enrolled', 'lost']
    )

    # =====================================================
    # Follow-up Summary
    # =====================================================

    due_today = today_followups.count()

    overdue_count = LeadCapture.objects.filter(
        next_followup_date__lt = today
    ).exclude(
        initial_status__in = ['enrolled', 'lost']
    ).count()

    completed_today = LeadCapture.objects.filter(
        updated_at__date=today,
        initial_status__in=['enrolled', 'lost']
    ).count()

    # =====================================================
    # Lead Source Summary
    # =====================================================

    lead_sources = LeadCapture.objects.values(
        'lead_source'
    ).annotate(
        total = Count('id')
    ).order_by('-total')

    # =====================================================
    # Course Interest Summary
    # =====================================================

    course_interseted = LeadCapture.objects.values(
        'course_interested'
    ).annotate(
        total = Count('id')
    ).order_by('-total')

    # =====================================================
    # Assigned Staff Summary
    # =====================================================

    assigned_staff = LeadCapture.objects.values(
        'assigned_to__first_name',
        'assigned_to__last_name'
    ).annotate(
        total_leads = Count('id')
    ).order_by('-total_leads')

    context = {
        'total_staff' : total_staff,
        'active_staff' : active_staff,
        'on_leave' : on_leave,
        'terminated' : terminate,
        'inactive' : inactive,
        'recent_staff' : recent_staff,
        'average_rating' : average_rating,
        'present' : present,
        'late' : late,
        'absent' : absent,
        'leave' : leave,
        'departments': departments,
        'attendance_percentage': attendance_percentage,
        'staff_status': staff_status,  
        'roles': roles,

        # Leads Module

        'total_leads': total_leads,
        'new_leads': new_leads,
        'contacted_leads': contacted_leads,
        'interested_leads': interested_leads,
        'demo_leads': demo_leads,
        'enrolled_leads': enrolled_leads,
        'lost_leads': lost_leads,
        'conversion_rate': conversion_rate,
        'recent_leads' : recent_leads,
        'today_followups': today_followups,
        'due_today': due_today,
        'overdue_count': overdue_count,
        'completed_today': completed_today,
        'lead_sources': lead_sources,
        'course_interseted': course_interseted,
        'assigned_staff': assigned_staff,
    }
    return render( request, 'staff/dashboard.html', context)

# ================================ MY PROFILE ================================

def staff_profile(request, staff_id):
    """View and edit a staff member's own profile page"""

    staff = get_object_or_404(Staff, id=staff_id)

    # Handle Edit Profile form submission
    if request.method == 'POST':
        form = staffProfileForm(request.POST, request.FILES, instance=staff)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('staff_profile', staff_id=staff.id)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = staffProfileForm(instance=staff)

    # Attendance this month
    now = timezone.now()
    this_month_attendance = Attendance.objects.filter(
        staff=staff,
        date__year=now.year,
        date__month=now.month
    )
    days_present = this_month_attendance.filter(status__in=['Present', 'Late']).count()
    # Approximate working days in month (Mon-Fri)
    import calendar
    cal = calendar.monthcalendar(now.year, now.month)
    working_days = sum(1 for week in cal for day in week[0:5] if day != 0)

    # Leave balance (days not marked Absent/Present in month, rough calc)
    leave_days = this_month_attendance.filter(status='Leave').count()
    # Simple leave balance: assume 15 days annual / 12 months
    leave_balance = max(0, 15 - leave_days)

    # Tasks completed (converted leads as proxy)
    tasks_completed = Lead.objects.filter(staff=staff, status='converted').count()
    tasks_total = Lead.objects.filter(staff=staff).count()

    context = {
        'staff': staff,
        'form': form,
        'days_present': days_present,
        'working_days': working_days,
        'leave_balance': leave_balance,
        'tasks_completed': tasks_completed,
        'tasks_total': tasks_total,
    }
    return render(request, 'staff/staff_profile.html', context)