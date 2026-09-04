from rest_framework import serializers
from .models import (
    Partner, Course, CourseVideo, QuizQuestion, QuizBankQuestion, CourseAssignment,
    CourseRating, QuizAttempt, PartnerProgress, VideoCheckpoint,
    Deal, Commission, Opportunity, OpportunityEvent, TrainingResult, Certification,
    Product, Notification, CourseExamQuestion,
)


def localize(obj, field_name, lang="en"):
    val = getattr(obj, field_name, None)
    if isinstance(val, dict):
        return val.get(lang) or val.get("en") or next((v for v in val.values() if v), "")
    return val or ""


class PartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partner
        fields = [
            "id", "company_name", "email", "phone", "tax_id", "country", "contact_name",
            "role", "training_track", "status", "commission_rate", "notes", "why_partner",
            "sales_approach", "certification_date", "created_at",
        ]


class PartnerCreateSerializer(serializers.Serializer):
    company_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()
    phone = serializers.CharField(default="", required=False)
    tax_id = serializers.CharField(default="", required=False)
    country = serializers.CharField(default="", required=False)
    contact_name = serializers.CharField(default="", required=False)
    why_partner = serializers.CharField(default="", required=False)
    sales_approach = serializers.CharField(default="", required=False)


class PartnerUpdateSerializer(serializers.Serializer):
    company_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    tax_id = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    training_track = serializers.ChoiceField(choices=[c[0] for c in Partner.TRACK_CHOICES], required=False, allow_blank=True)
    commission_rate = serializers.FloatField(required=False)
    notes = serializers.CharField(required=False)


class CourseVideoSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = CourseVideo
        fields = ["id", "title", "description", "video_url", "duration_seconds", "video_order", "phase", "day"]

    def __init__(self, *args, **kwargs):
        self._lang = kwargs.pop("lang", "en")
        super().__init__(*args, **kwargs)

    def get_title(self, obj):
        return localize(obj, "title", self._lang)

    def get_description(self, obj):
        return localize(obj, "description", self._lang)


class CourseSerializer(serializers.ModelSerializer):
    videos = serializers.SerializerMethodField()
    video_count = serializers.SerializerMethodField()
    progress_pct = serializers.SerializerMethodField()
    completed = serializers.SerializerMethodField()
    pass_mark = serializers.SerializerMethodField()
    prerequisite = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()
    rating_avg = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    rated = serializers.SerializerMethodField()
    total_duration = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id", "title", "description", "thumbnail_url", "category",
            "level", "track", "status", "related_products", "pass_mark", "validity_months",
            "prerequisite_course_id", "prerequisite", "quiz_questions_count",
            "exam_questions_count", "max_quiz_attempts", "materials",
            "phase_config", "videos", "video_count", "progress_pct", "completed",
            "deadline", "rating_avg", "rating_count", "rated", "total_duration", "created_at",
        ]

    def __init__(self, *args, **kwargs):
        self._partner = kwargs.pop("partner", None)
        self._lang = kwargs.pop("lang", "en")
        super().__init__(*args, **kwargs)

    def get_title(self, obj):
        return localize(obj, "title", self._lang)

    def get_description(self, obj):
        return localize(obj, "description", self._lang)

    def get_videos(self, obj):
        return CourseVideoSerializer(obj.videos.all(), many=True, lang=self._lang).data

    def get_video_count(self, obj):
        return obj.videos.count()

    def get_pass_mark(self, obj):
        return obj.pass_mark

    def get_prerequisite(self, obj):
        if not obj.prerequisite_course_id:
            return None
        try:
            prereq = Course.objects.get(id=obj.prerequisite_course_id)
            return {"id": prereq.id, "title": localize(prereq, "title", self._lang)}
        except Course.DoesNotExist:
            return None

    def get_deadline(self, obj):
        if self._partner and self._partner.role == "socio":
            asg = CourseAssignment.objects.filter(course=obj, partner=self._partner).first()
            return asg.deadline.isoformat() if asg and asg.deadline else None
        return None

    def get_rating_avg(self, obj):
        ratings = list(obj.ratings.values_list("stars", flat=True))
        if not ratings:
            return 0
        return round(sum(ratings) / len(ratings), 1)

    def get_rating_count(self, obj):
        return obj.ratings.count()

    def get_rated(self, obj):
        if not self._partner:
            return None
        r = CourseRating.objects.filter(course=obj, partner=self._partner).first()
        return {"stars": r.stars, "comment": r.comment} if r else None

    def get_progress_pct(self, obj):
        if self._partner:
            prog = PartnerProgress.objects.filter(partner=self._partner, course=obj).first()
            return prog.progress_pct if prog else 0
        return 0

    def get_completed(self, obj):
        if self._partner:
            prog = PartnerProgress.objects.filter(partner=self._partner, course=obj).first()
            return prog.completed if prog else False
        return False

    def get_total_duration(self, obj):
        from django.db.models import Sum
        return obj.videos.aggregate(total=Sum('duration_seconds'))['total'] or 0


class CourseCreateSerializer(serializers.Serializer):
    title = serializers.JSONField()
    description = serializers.JSONField(default=dict, required=False)
    category = serializers.CharField(default="", required=False, allow_blank=True)
    level = serializers.CharField(default="beginner", required=False, allow_blank=True)
    track = serializers.CharField(default="todas", required=False, allow_blank=True)
    status = serializers.CharField(default="publicado", required=False, allow_blank=True)
    thumbnail_url = serializers.CharField(default="", required=False, allow_blank=True)
    related_products = serializers.JSONField(default=list, required=False)
    pass_mark = serializers.IntegerField(default=80, required=False)
    validity_months = serializers.IntegerField(default=12, required=False)
    prerequisite_course_id = serializers.CharField(default="", required=False, allow_blank=True)
    quiz_questions_count = serializers.IntegerField(default=8, required=False)
    exam_questions_count = serializers.IntegerField(default=5, required=False)
    max_quiz_attempts = serializers.IntegerField(default=3, required=False)
    materials = serializers.JSONField(default=list, required=False)
    phase_config = serializers.JSONField(default=list, required=False)


class CourseUpdateSerializer(serializers.Serializer):
    title = serializers.JSONField(required=False)
    description = serializers.JSONField(required=False)
    category = serializers.CharField(required=False, allow_blank=True)
    level = serializers.CharField(required=False, allow_blank=True)
    thumbnail_url = serializers.CharField(required=False, allow_blank=True)
    track = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    related_products = serializers.JSONField(required=False)
    pass_mark = serializers.IntegerField(required=False)
    validity_months = serializers.IntegerField(required=False)
    prerequisite_course_id = serializers.CharField(required=False, allow_blank=True)
    quiz_questions_count = serializers.IntegerField(required=False)
    exam_questions_count = serializers.IntegerField(required=False)
    max_quiz_attempts = serializers.IntegerField(required=False)
    materials = serializers.JSONField(required=False)
    phase_config = serializers.JSONField(required=False)


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ["id", "question", "options", "correct_index", "correct_indices", "fill_answer", "question_type", "order"]


class QuizQuestionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ["id", "question", "options", "correct_index", "correct_indices", "fill_answer", "question_type", "order"]


class QuizBankQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizBankQuestion
        fields = ["id", "question", "options", "correct_index", "correct_indices", "fill_answer", "question_type", "track", "created_at"]


class VideoCheckpointSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCheckpoint
        fields = ["id", "timestamp_seconds", "question", "options", "correct_index", "on_wrong_timestamp", "order"]


class VideoCheckpointPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCheckpoint
        fields = ["id", "timestamp_seconds", "question", "options", "order"]


class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = ["id", "video_id", "question_id", "selected_index", "answer_data", "is_correct", "created_at"]


class CourseAssignmentSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseAssignment
        fields = ["id", "course_id", "partner_id", "partner_name", "deadline", "created_at"]

    def get_partner_name(self, obj):
        return obj.partner.company_name if obj.partner else ""


class CourseRatingSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseRating
        fields = ["id", "course_id", "partner_id", "partner_name", "stars", "comment", "created_at"]

    def get_partner_name(self, obj):
        return obj.partner.company_name if obj.partner else ""


class DealSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()

    class Meta:
        model = Deal
        fields = [
            "id", "partner_id", "partner_name", "client_name", "client_industry",
            "estimated_value", "status", "notes", "created_at", "updated_at",
        ]

    def get_partner_name(self, obj):
        return obj.partner.company_name if obj.partner else ""


class DealCreateSerializer(serializers.Serializer):
    client_name = serializers.CharField()
    client_industry = serializers.CharField(default="", required=False)
    estimated_value = serializers.FloatField(default=0.0, required=False)
    notes = serializers.CharField(default="", required=False)


class DealUpdateSerializer(serializers.Serializer):
    status = serializers.CharField(required=False)
    estimated_value = serializers.FloatField(required=False)
    notes = serializers.CharField(required=False)


class CommissionSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    deal_value = serializers.SerializerMethodField()
    paid_date = serializers.DateTimeField(source="paid_at", read_only=True)

    class Meta:
        model = Commission
        fields = ["id", "partner_id", "deal_id", "amount", "status", "paid_date", "client_name", "deal_value", "created_at"]

    def get_client_name(self, obj):
        return obj.deal.client_name if obj.deal else ""

    def get_deal_value(self, obj):
        return obj.deal.estimated_value if obj.deal else 0.0


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["key", "name", "description", "price_usd", "price_eur", "price_chf", "price_otro", "custom_currency", "category", "active", "sort_order", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "partner_id", "type", "title", "message", "link", "read", "created_at"]

    def get_title(self, obj):
        lang = self.context.get("lang", "en")
        t = obj.title or {}
        return t.get(lang) or t.get("en") or t.get("es") or t.get("de") or ""

    def get_message(self, obj):
        lang = self.context.get("lang", "en")
        m = obj.message or {}
        return m.get(lang) or m.get("en") or m.get("es") or m.get("de") or ""


class OpportunitySerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()
    stage_label = serializers.SerializerMethodField()
    company_size_label = serializers.SerializerMethodField()
    products_labels = serializers.SerializerMethodField()
    conflict = serializers.SerializerMethodField()
    protection_days_left = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = [
            "id", "partner_id", "partner_name", "name", "company_name",
            "company_size", "company_size_label", "products", "products_labels",
            "operation_mode", "stage", "stage_label", "probability", "amount",
            "scan_one_time_fee", "currency", "custom_currency",
            "delivery_quarter", "close_date", "deal_owner",
            "channel_manager", "opportunity_type", "forecast_category",
            "lead_source", "conflict", "conflict_indicator", "protection_end_date",
            "protection_days_left", "next_steps", "loss_reason", "notes",
            "last_activity", "created_at", "updated_at",
        ]

    def get_partner_name(self, obj):
        return obj.partner.company_name if obj.partner else ""

    def get_stage_label(self, obj):
        return dict(obj.STAGE_CHOICES).get(obj.stage, obj.stage)

    def get_company_size_label(self, obj):
        return dict(obj.COMPANY_SIZE_CHOICES).get(obj.company_size, obj.company_size)

    def get_products_labels(self, obj):
        keys = obj.products or []
        catalog = {p.key: (p.name or {}) for p in Product.objects.filter(key__in=keys)}
        out = []
        for k in keys:
            if k in catalog and isinstance(catalog[k], dict):
                nm = catalog[k]
                out.append(nm.get("en") or nm.get("es") or nm.get("de") or k)
            else:
                out.append(dict(obj.PRODUCT_CHOICES).get(k, k))
        return out

    def get_conflict(self, obj):
        return obj.conflict_indicator

    def get_protection_days_left(self, obj):
        if not obj.protection_end_date:
            return None
        from django.utils import timezone
        return (obj.protection_end_date - timezone.localdate()).days


class OpportunityCreateSerializer(serializers.Serializer):
    company_name = serializers.CharField(allow_blank=True)
    company_size = serializers.CharField(required=False, allow_blank=True, default="<250")
    products = serializers.ListField(child=serializers.CharField(), default=list)
    operation_mode = serializers.ChoiceField(choices=Opportunity.OPERATION_MODE_CHOICES, default="cloud")
    stage = serializers.ChoiceField(choices=Opportunity.STAGE_CHOICES, default="registrada")
    probability = serializers.IntegerField(required=False)
    amount = serializers.FloatField(default=0.0, required=False)
    scan_one_time_fee = serializers.FloatField(default=0.0, required=False)
    currency = serializers.ChoiceField(choices=Opportunity.CURRENCY_CHOICES, default="usd")
    custom_currency = serializers.CharField(default="", required=False, allow_blank=True)
    delivery_quarter = serializers.CharField(default="", required=False, allow_blank=True)
    close_date = serializers.DateField(required=False, allow_null=True)
    deal_owner = serializers.CharField(default="", required=False, allow_blank=True)
    channel_manager = serializers.CharField(default="", required=False, allow_blank=True)
    opportunity_type = serializers.ChoiceField(choices=Opportunity.OPPORTUNITY_TYPE_CHOICES, default="nuevo")
    forecast_category = serializers.ChoiceField(choices=Opportunity.FORECAST_CHOICES, required=False, allow_null=True)
    lead_source = serializers.ChoiceField(choices=Opportunity.LEAD_SOURCE_CHOICES, default="generada_partner")
    next_steps = serializers.CharField(default="", required=False, allow_blank=True)
    notes = serializers.CharField(default="", required=False, allow_blank=True)


class OpportunityUpdateSerializer(serializers.Serializer):
    company_name = serializers.CharField(required=False, allow_blank=True)
    company_size = serializers.CharField(required=False, allow_blank=True)
    products = serializers.ListField(child=serializers.CharField(), required=False)
    operation_mode = serializers.ChoiceField(choices=Opportunity.OPERATION_MODE_CHOICES, required=False)
    stage = serializers.ChoiceField(choices=Opportunity.STAGE_CHOICES, required=False)
    probability = serializers.IntegerField(required=False)
    amount = serializers.FloatField(required=False)
    scan_one_time_fee = serializers.FloatField(required=False)
    currency = serializers.ChoiceField(choices=Opportunity.CURRENCY_CHOICES, required=False)
    custom_currency = serializers.CharField(required=False, allow_blank=True)
    delivery_quarter = serializers.CharField(required=False, allow_blank=True)
    close_date = serializers.DateField(required=False, allow_null=True)
    deal_owner = serializers.CharField(required=False, allow_blank=True)
    channel_manager = serializers.CharField(required=False, allow_blank=True)
    opportunity_type = serializers.ChoiceField(choices=Opportunity.OPPORTUNITY_TYPE_CHOICES, required=False)
    forecast_category = serializers.ChoiceField(choices=Opportunity.FORECAST_CHOICES, required=False, allow_null=True)
    lead_source = serializers.ChoiceField(choices=Opportunity.LEAD_SOURCE_CHOICES, required=False)
    conflict_indicator = serializers.BooleanField(required=False)
    next_steps = serializers.CharField(required=False, allow_blank=True)
    loss_reason = serializers.ChoiceField(choices=Opportunity.LOSS_REASON_CHOICES, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class OpportunityEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpportunityEvent
        fields = ["id", "opportunity_id", "from_stage", "to_stage", "field_changes", "created_at"]


class TrainingResultSerializer(serializers.ModelSerializer):
    course_title = serializers.SerializerMethodField()

    class Meta:
        model = TrainingResult
        fields = ["id", "partner_id", "course_id", "course_title", "attempt_number", "score", "passed", "certificate_url", "created_at"]

    def get_course_title(self, obj):
        return localize(obj.course, "title", "en")


class CertificationSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()

    class Meta:
        model = Certification
        fields = ["id", "partner_id", "partner_name", "level", "status", "certified_at", "valid_until"]

    def get_partner_name(self, obj):
        return obj.partner.company_name if obj.partner else ""


class CourseExamQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseExamQuestion
        fields = ["id", "course_id", "question", "options", "correct_index", "correct_indices", "question_type", "order", "created_at"]
        read_only_fields = ["id", "created_at"]
